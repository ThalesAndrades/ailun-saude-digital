const fs = require('fs')
const path = require('path')

function parseRemote(remote) {
  if (!remote) return null
  // git@github.com:owner/repo.git or https://github.com/owner/repo.git
  const sshMatch = remote.match(/github\.com:(.+?)\/(.+?)(\.git)?$/)
  if (sshMatch) return { owner: sshMatch[1], repo: sshMatch[2] }
  const httpsMatch = remote.match(/github\.com\/(.+?)\/(.+?)(\.git)?$/)
  if (httpsMatch) return { owner: httpsMatch[1], repo: httpsMatch[2] }
  return null
}

async function main() {
  const token = process.env.GITHUB_PAT || process.env.GITHUB_TOKEN
  const repoName = process.env.GITHUB_REPO || 'ailun-saude'
  const remote = process.env.GITHUB_REMOTE
  const remoteParsed = parseRemote(remote)
  if (!token) {
    console.error('Falta GITHUB_PAT em ambiente')
    process.exit(1)
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'AilunSaudeUploader/1.0'
  }
  const api = async (route, init = {}) => {
    const res = await fetch(`https://api.github.com${route}`, { ...init, headers: { ...headers, ...(init.headers || {}) } })
    const text = await res.text()
    let data
    try { data = JSON.parse(text) } catch { data = { raw: text } }
    if (!res.ok) {
      throw new Error(`GitHub API ${route} failed: ${res.status} ${res.statusText} ${text}`)
    }
    return data
  }

  const user = await api('/user')
  const defaultOwner = user.login
  const owner = remoteParsed?.owner || defaultOwner
  const finalRepo = remoteParsed?.repo || repoName

  // Try to create the repository unless remote provided
  let repo
  if (!remoteParsed) {
    try {
      repo = await api('/user/repos', {
        method: 'POST',
        body: JSON.stringify({ name: finalRepo, private: false, auto_init: false })
      })
      console.log(`Repo criado: https://github.com/${owner}/${finalRepo}`)
    } catch (err) {
      try {
        repo = await api(`/repos/${owner}/${finalRepo}`)
        console.log(`Usando repo existente: https://github.com/${owner}/${finalRepo}`)
      } catch {
        throw err
      }
    }
  } else {
    repo = await api(`/repos/${owner}/${finalRepo}`)
    console.log(`Usando repo remoto: https://github.com/${owner}/${finalRepo}`)
  }

  const rootDir = process.cwd()
  const ignore = new Set(['.git', 'node_modules', '.trae', 'build', 'dist'])
  const ignoreFiles = new Set(['.env', '.env.test', '.env.production', 'config.json'])

  const listFiles = (dir) => {
    const out = []
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      const rel = path.relative(rootDir, full).replace(/\\/g, '/')
      if (ignore.has(e.name)) continue
      if (ignoreFiles.has(e.name)) continue
      if (e.isDirectory()) {
        out.push(...listFiles(full))
      } else if (e.isFile()) {
        out.push(rel)
      }
    }
    return out
  }

  const files = listFiles(rootDir)
  console.log(`Total de arquivos para enviar: ${files.length}`)

  // Try blob/tree commit API; on 403, fallback to contents API
  const tryBlobCommit = async () => {
    const blobs = {}
    for (const rel of files) {
      const content = fs.readFileSync(path.join(rootDir, rel))
      const blob = await api(`/repos/${owner}/${finalRepo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({ content: content.toString('base64'), encoding: 'base64' })
      })
      blobs[rel] = blob.sha
    }
    const tree = files.map(rel => ({ path: rel, mode: '100644', type: 'blob', sha: blobs[rel] }))
    const treeResp = await api(`/repos/${owner}/${finalRepo}/git/trees`, { method: 'POST', body: JSON.stringify({ tree }) })
    let parents = []
    try {
      const ref = await api(`/repos/${owner}/${finalRepo}/git/ref/heads/main`)
      const head = ref.object.sha
      parents = [head]
    } catch {}
    const commitResp = await api(`/repos/${owner}/${finalRepo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({ message: 'feat: projeto Ailun Saúde', tree: treeResp.sha, parents })
    })
    try {
      await api(`/repos/${owner}/${finalRepo}/git/refs`, { method: 'POST', body: JSON.stringify({ ref: 'refs/heads/main', sha: commitResp.sha }) })
    } catch (err) {
      if (String(err.message).includes('Reference already exists')) {
        await api(`/repos/${owner}/${finalRepo}/git/refs/heads/main`, { method: 'PATCH', body: JSON.stringify({ sha: commitResp.sha, force: true }) })
      } else {
        throw err
      }
    }
  }

  try {
    await tryBlobCommit()
    console.log(`Push concluído (git objects): https://github.com/${owner}/${finalRepo}`)
    return
  } catch (err) {
    console.log('Falha no push via git objects, tentando via contents API:', err.message)
  }

  for (const rel of files) {
    const content = fs.readFileSync(path.join(rootDir, rel))
    let sha = undefined
    try {
      const existing = await api(`/repos/${owner}/${finalRepo}/contents/${encodeURIComponent(rel)}?ref=main`)
      sha = existing.sha
    } catch {}
    await api(`/repos/${owner}/${finalRepo}/contents/${encodeURIComponent(rel)}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: `feat: add ${rel}`,
        content: content.toString('base64'),
        branch: 'main',
        ...(sha ? { sha } : {})
      })
    })
  }
  console.log(`Push concluído (contents API): https://github.com/${owner}/${finalRepo}`)
}

main().catch(err => { console.error(err.message); process.exit(1) })