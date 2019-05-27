import HTTP from '../request/axios'

const SHUTTLE_BasicInformation = () => { // 获取基础信息表
  return HTTP({
    url: '/shuttle/api/v1/basicInformation/basicInformation',
    data: {
      typeList: '5,6,8,13,24,25,28,29,34,35,36,27'
    }
  })
}

export default {
  SHUTTLE_BasicInformation
}