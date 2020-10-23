import simpleGit, { SimpleGit } from 'simple-git'
import { writeFileSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { File } from '../types/file'
import { UserType } from '../types/user'
import { validateBranchName, sanitizeString } from '../utils/utils'
import { SaveArgs } from '../types/params'

export const pullMasterChanges = async (httpsURL: string): Promise<void> => {
  const url = new URL(httpsURL)
  const repositoryName = url.pathname

  await simpleGit(`./repositories/${repositoryName}`)
    .fetch('origin')
    .pull('origin', 'master')
}

export const cloneRepository = async (httpsURL: string): Promise<void> => {
  const url = new URL(httpsURL)
  const repositoryName = url.pathname

  await simpleGit().clone(httpsURL, `./repositories/${repositoryName}`)
}

export const saveChanges = async (
  saveArgs: SaveArgs,
  user: UserType
): Promise<void> => {
  
  const { username, gitHubEmail, gitHubToken } = user
  const { file, branch, commitMessage } = saveArgs

  const repositoryName = getRepositoryFromFilePath(file)
  
  const gitObject = setupGitConfig(
    username, 
    gitHubEmail ?? '', 
    repositoryName
  )

  await gitCheckout(gitObject, branch)
 
  writeToFile(file)

  const realFilename = getFileNameFromFilePath(file, repositoryName)
  await gitAdd(gitObject, [realFilename])

  const validCommitMessage = makeCommitMessage(commitMessage, username, realFilename)
  
  await gitCommit(gitObject, validCommitMessage) 

  await gitPush(
    gitObject,
    username, 
    gitHubToken ?? '', 
    branch
  )
}

const getRepositoryFromFilePath = (file: File) => {
  return file.name.split('/').slice(0, 2).join('/')
}

const getFileNameFromFilePath = (file: File, repositoryName: string) => {
  return file.name.replace(`${repositoryName}/`, '') || file.name
}

const setupGitConfig = (username: string, email: string, repositoryName: string):SimpleGit => {
  return simpleGit(`./repositories/${repositoryName}`)
  .addConfig('user.name', username)
  .addConfig('user.email', email)
}

const gitCheckout = async (git:SimpleGit, branchName: string) => {
  await validateBranchName(branchName)
  await git.checkout([branchName])
}

const writeToFile = (file: File) => {
  writeFileSync(`./repositories/${file.name}`, file.content)
}

const gitAdd = async (git:SimpleGit, files: Array<string>) => {
  await git.add(files)
}

const makeCommitMessage = (rawCommitMessage: string, username: string, realFilename: string) => {
  return rawCommitMessage ? sanitizeString(rawCommitMessage) : `User ${username} modified file ${realFilename}`
}

const gitCommit = async (git:SimpleGit, commitMessage: string) => {
  await git.commit(commitMessage)
}

const gitPush = async (git:SimpleGit, username: string, token: string, branchName: string) => {
  const remoteUuid = uuidv4()
  await gitAddRemote(git, remoteUuid, username, token)
  await git.push(remoteUuid, branchName)
  await gitRemoveRemote(git, remoteUuid)
}

const gitAddRemote = async (git:SimpleGit, remoteId: string, username: string, token: string) => {  
  await git.addRemote(
    remoteId,
    `https://${username}:${token}@github.com/ohtuprojekti-eficode/robot-test-files`
  )
}

const gitRemoveRemote = async (git:SimpleGit, remoteId: string) => {
  await git.removeRemote(remoteId)
}