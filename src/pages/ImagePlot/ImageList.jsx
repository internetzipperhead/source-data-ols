import React, { Component } from 'react'
import { inject, observer } from 'mobx-react'
import { Avatar, Button, Divider, Input, Select, Progress, Tooltip,
 Table, Tag, Modal, message, Pagination } from 'antd'

import './style.less'
import api from '@/api'
import { calculateSize } from '@/util'

const statusText = ['转码未开始', '转码中...', '转码成功', '转码失败']
const statusColor = ['geekblue', '#a0d911', 'green', 'red']


@inject('appStore')
@observer
class ImageBatchList extends Component {

  constructor(props) {
    super(props)
    this.state = {
      loading: true,
      currentPage: 1,
      limit: 20,
      total: 0,
      isDeleting: false,
      columns: [
        {
          title: '序号',
          dataIndex: '_',
          key: '_',
          render: (_, r, index) => <span>{index + 1}</span>
        }, {
          title: '文件名称',
          dataIndex: 'id',
          key: 'id',
          render: (_, record) => {
            if (record.uploadName.length > 20) {
              return <Tooltip title={record.uploadName}>
                <span>{record.uploadName.slice(0, 20) + '...'}</span>
              </Tooltip>
            }
            return <span>{record.uploadName}</span>
          }
        }, {
          title: '文件大小',
          dataIndex: 'size',
          key: 'size',
          render: size => <span>{calculateSize(size)}</span>
        }, {
          title: '上传时间',
          dataIndex: 'createTime',
          key: 'createTime'
        }, {
          title: '完成情况',
          dataIndex: 'total',
          key: 'total',
          render: (total, record) => {
            if (record.status === 2) {
              let percent = (record.finished * 100 / total)
              return <Progress percent={percent === 0 ? 0 : +percent.toPrecision(3).replace(/\.0+$/, '')} />
            }
            return '--'
          }
        }, {
          title: '状态',
          dataIndex: 'status',
          key: 'status',
          render: (status, record) => {
            if (status >= 1) {
              return <Tooltip title='点击查看详情'>
                <Tag
                  onClick={() => this.checkUploadDetail(record)}
                  color={statusColor[status]} style={{ cursor: 'pointer'}}>
                  {statusText[status]}
                </Tag>
              </Tooltip>
            }
            return <Tag color={statusColor[status]}>{statusText[status]}</Tag>
          }
        }, {
          title: '操作', // 0: 未转码；1：转码中；2：成功；3：失败
          width: 150,
          render: record => (
            <span>
              <Button disabled={record.status !== 2} onClick={this.onHandlePlot.bind(this, record)} type="primary" size="small">详情</Button>
              <Divider type="vertical" />
              <Button disabled={record.status <= 1} onClick={this.onHandleDelete.bind(this, record)} type="danger" size="small">删除</Button>
            </span>
          )
        }
      ],
      dataSource: [],
      uploadName: '',
      uploadStatus: 0
    }
  }

  componentDidMount() {
    this.fetchData()
  }

  fetchData() {
    let data = {
      page: this.state.currentPage,
      limit: 20,
      uploadName: this.state.uploadName,
      uploadStatus: this.state.uploadStatus
    }
    // -其他请求获取图像标记列表
    api.fetchPlotUploads(data).then(res => {
      console.log(res)
      if (res.result) {
        this.setState({
          loading: false,
          total: res.data.count,
          dataSource: res.data.uploads
        })
      }
    }).catch(() => {
      this.setState({
        loading: false
      })
    })
  }

  checkUploadDetail = record => {
    let name = record.uploadName.length > 10 ? `${record.uploadName.slice(0, 5)}....zip` : record.uploadName
    this.props.appStore.updateNavBreadcrumb([
      {
        path: 'plot',
        name: '标图素材'
      },
      {
        path: 'plotDetail',
        name: `${name}上传日志`
      }
    ])
    this.props.history.push(`/log/${record.id}?type=upload`)
  }

  deleteUploadFile = id => {
    api.deletePlotUploadBatch(id).then(res => {
      if (res.result) {
        message.success('文件删除成功！')
        this.fetchData()
      }
    })
  }

  uploadImage = () => {
    this.props.appStore.toggleUploaderGlobal(true)
    this.props.appStore.toggleUploaderMini(false)
  }

  onHandlePlot = data => {
    this.props.appStore.updateNavBreadcrumb([
      {
        path: 'plot',
        name: '标图素材'
      },
      {
        path: 'plotDetail',
        name: '在线标图'
      }
    ])
    this.props.history.push(`/plot/${data.id}`)
  }

  onHandleDelete = data => {
    Modal.confirm({
      title: '你确定要删除该文件吗？',
      content: <div>
        <p>文件名：<span style={{ fontWeight: 600, color: 'red' }}>{data.uploadName}</span></p>
        <p>该操作不可逆，请慎重考虑!</p>
      </div>,
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        if (this.setState.isDeleting) {
          return
        }
        this.setState({
          isDeleting: true
        })
        this.deleteUploadFile(data.id)
      },
      onCancel() {
        console.log('cancel')
      }
    })
  }

  search = value => {
    this.setState({
      uploadName: value.trim()
    }, this.fetchData)
  }

  handleSelectChange = value => {
    this.setState({
      uploadStatus: value
    }, this.fetchData)
  }

  handlePageChange = currentPage => {
    this.setState({
      currentPage
    }, this.fetchData)
  }

  render() {
    let { loading, dataSource, columns, total, currentPage, limit } = this.state
    let local = {
      emptyText: <p className="m-plot-info">暂时没有标图数据，请先上传标图素材</p>
    }

    return (
      <div className="m-plot">
        {/* 查询、筛选、上传按钮 */}
        <div className="m-plot-header">
          <div className="m-plot-search">
            <Input.Search
              style={{ width: '65%' }}
              allowClear
              enterButton
              placeholder="请输入上传文件名称"
              onPressEnter={e => this.search(e.target.value)}
              onSearch={this.search}
            />
            <Select
              style={{ width: '30%' }}
              placeholder="标图状态"
              defaultValue="0"
              onChange={this.handleSelectChange}
            >
              <Select.Option value="0" label="全部">全部</Select.Option>
              <Select.Option value="1" label="标图完成">标图完成</Select.Option>
              <Select.Option value="2" label="标图未完成">标图未完成</Select.Option>
            </Select>
          </div>
          <div className="m-plot-upload">
            <div className="m-plot-upload-icon" onClick={this.uploadImage}>
              <Avatar size={64} icon="cloud-upload" style={{ color: '#f56a00', backgroundColor: '#fde3cf' }} />
              <p>点击进行图像上传<span>(仅支持zip压缩文件)</span></p>
            </div>
          </div>
        </div>

        {/* 列表 */}
        <Table dataSource={dataSource} columns={columns} loading={loading} locale={local} pagination={false} rowKey="id" />

        {/* 分页 */}
        {total > 0
          && <Pagination
                showQuickJumper
                current={currentPage}
                total={total}
                pageSize={limit}
                showTotal={total => `总共 ${total} 条`}
                onChange={this.handlePageChange}
                style={{ float: 'right', marginTop: '12px' }}
              />
        }
      </div>
    )
  }
}

export default ImageBatchList
