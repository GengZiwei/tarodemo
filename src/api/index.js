import account from './account'
import auth from './auth'
import comments from './comments'
import profile from './profile'
import route from './route'
import shuttle from './shuttle'
import track from './track'
import wallet from './wallet'

const api = {
  ...account,
  ...auth,
  ...comments,
  ...profile,
  ...route,
  ...shuttle,
  ...track,
  ...wallet,
}

export default api