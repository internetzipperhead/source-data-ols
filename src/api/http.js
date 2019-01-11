/**
 * 封装http请求
 */
import axios from 'axios'
import qs from 'qs'
import { message } from 'antd'
import Auth from '@/util/auth'
import { BrowserRouter } from 'react-router-dom'


const router = new BrowserRouter()
const routeSkip = path => {
  router.history.push(path)
  router.history.go()
}

// !创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:5280/v1',
  timeout: 5000
})

// !请求拦截
service.interceptors.request.use(config => {
  let userTicket = Auth.getToken()
  if (userTicket) {
    config.headers.Authorization = `Bearer ${Auth.getToken()}`
  }
  return config
}, error => {
  return Promise.reject(error)
})

// !响应拦截
service.interceptors.response.use(response => {
  if (!response.data.result) {
    return Promise.reject(response.data.msg)
  }
  return response
}, error => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        console.log('%c ❗❗❗ 通过服务器进行权限限制 ', 'background:#f90;color:#555')
        // console.log(router.history)
        routeSkip('/login')
        return Promise.reject(error.response)
      case 500:
        message.error('Server Error')
        routeSkip('/500')
        return Promise.reject(error.response)
      default:
        break
    }
  } else {
    routeSkip('/login')
  }
})

export default {
  get (url, data = {}, options = {}) {
    let config = {
      params: data,
      paramsSerializer: function (params) {
        return qs.stringify(params, {arrayFormat: 'brackets'})
      },
      ...options
    }
    return new Promise((resolve, reject) => {
      service.get(url, config)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  },
  post (url, data = {}, options = {}) {
    let contentType = 'application/json'
    switch (options.contentType) {
      case 'form':
        data = qs.stringify(data)
        contentType = 'application/x-www-form-urlencoded;charset=utf-8'
        break
      case 'file':
        contentType = 'application/form-data'
        break
      default:
        data = JSON.stringify(data)
        break
    }
    let config = {
      headers: {
        'Content-Type': contentType
      }
    }
    return new Promise((resolve, reject) => {
      service.post(url, data, config)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  },
  put (url, data = {}, options = {}) {
    let contentType = 'application/json'
    if (options.contentType === 'form') {
      contentType = 'application/x-www-form-urlencoded;charset=utf-8'
      data = qs.stringify(data)
    } else {
      data = JSON.stringify(data)
    }
    let config = {
      headers: {
        'Content-Type': contentType
      }
    }
    return new Promise((resolve, reject) => {
      service.put(url, data, config)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  },
  delete (url, data = {}, options = {}) {
    let contentType = 'application/json'
    if (options.contentType === 'form') {
      contentType = 'application/x-www-form-urlencoded;charset=utf-8'
      data = qs.stringify(data)
    }
    let config = {
      data,
      headers: {
        'Content-Type': contentType
      },
      ...options
    }
    return new Promise((resolve, reject) => {
      service.delete(url, config)
        .then(res => resolve(res.data))
        .catch(err => reject(err))
    })
  }
}
