import React from 'react'
import { Route, Link } from 'react-router-dom'
import { useQuery } from '@apollo/client'
import { ALL_FILES } from './graphql/queries'
import { ME } from './graphql/queries'
import EditView from './components/EditView'
import LoginForm from './components/LoginForm'
import CallBack from './components/auth/CallBack'
import { FileListQueryResult } from './types'

const App = () => {
  const { loading, data, error } = useQuery<FileListQueryResult>(ALL_FILES)
  const { data: user } = useQuery(ME)

  const padding = {
    paddingRight: 5,
  }

  const logout = () => {
    localStorage.clear()
    window.location.href = '/'
  }

  return (
    <div>
      <div>
        <Link style={padding} to="/">
          Main menu
        </Link>
        <Link style={padding} to="/edit">
          Edit view
        </Link>
        {(!user || !user.me) && (
          <Link style={padding} to="/login">
            Login
          </Link>
        )}
        {user && user.me && (
          <Link style={padding} to="/" onClick={logout}>
            {user.me.username} - logout
          </Link>
        )}
      </div>
      <div>
        <Route path="/auth/github/callback">
          <CallBack />
        </Route>
        <Route path="/edit">
          <EditView loading={loading} data={data} error={error} />
        </Route>
        <Route exact path="/login" component={LoginForm} />
      </div>
    </div>
  )
}

export default App
