const initCard = require('./function/initCard')
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 8002 });
const rooms = 12;//大厅最大房间数
function reSort(property){
  return function(a,b){
    var value1 = a[property];
    var value2 = b[property];
    return value2 - value1;
  }
}
wss.broadcast = function broadcast(data) {
  wss.clients.forEach(function each(client) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data);
    }
  });
};
var roomsInfo=[]
for(var i=0;i<rooms;i++){
  roomsInfo.push({
    clients:[{  //客户端信息
      index:'',
      ip:'',
      ws:''
    },{  
      index:'',
      ip:'',
      ws:''
    },{ 
      index:'',
      ip:'',
      ws:''
    }]
  })
}
function filterIP(roomsInfo){   //广播给client时过滤掉ws和ip
  var arr=[]
  roomsInfo.forEach((v,i)=>{
    arr.push({
     clients:[],
     ready:false 
    })
    v.clients.forEach((cv,ci)=>{
      arr[i].clients.push({
        index:cv.index
      })
    })
  })
  return arr
}
wss.on('connection', function(ws, req) {
    wss.broadcast(JSON.stringify({
      type:'init',
      total:Array.from(wss.clients).length,
      roomsInfo:filterIP(roomsInfo)
    }))
    //以下注释为解决统一ip下打开多个房间、座位后断线重连的问题，ip判定下不用考虑
    //多个房间、多个座位有玩家断开后，重连每次判定重连后都要中断循环，因为客户端只打开了一个。
    //所以一下循环要用some（forEach不能中断）
    roomsInfo.some((v,i)=>{      //断线重连
      if(v.drops===true){
        var roomDropsBol = true   //该房间全部在线
        v.clients.some((cv,ci)=>{
          if(cv.ip===req.connection.remoteAddress){
            if(cv.drops===true){
              roomDropsBol = false
              ws.index = ci
              ws.room = i
              roomsInfo[i].clients[ci].ws = ws
              var cardNum = []
              roomsInfo[i].clients.forEach((ccv,cci)=>{
                if(ccv.ws){
                  ccv.ws.send(JSON.stringify({
                    type:'notice',
                    info:'玩家'+(ws.index+1)+'重连'
                  }))
                }
                if(ccv.index!==ci&&roomsInfo[i].ready){
                  cardNum.push({
                    index:ccv.index,
                    num:roomsInfo[i].cardList[cci].length
                  })
                }
              })
              if(roomsInfo[i].ready){
                ws.send(JSON.stringify({
                  type:'reconnect',
                  data:v.cardList[cv.index],
                  index:ci+1,
                  room:i,
                  cardNum:cardNum,
                  activeCard: roomsInfo[i].activeCard,
                  bossCard:roomsInfo[i].cardList[3],
                  bossIndex:roomsInfo[i].bossIndex
                }))
              }else{
                ws.send(JSON.stringify({
                  type:'NULLreconnect'
                }))
              }
              cv.drops=false
              return true
            }
          }
        })
        if(!roomDropsBol){
          return true
        }else{
          v.drops=false
        }
      }
    })
    ws.on('message', function incoming(data) {
      var reqData = JSON.parse(data)
      if(reqData.type==='outCard'){   //只广播对应房间号的client
        reqData.data.forEach(v=>{
          roomsInfo[reqData.room].cardList[reqData.index-1].forEach((cv,ci)=>{
            if(v.label===cv.label&&v.type===cv.type){
              roomsInfo[reqData.room].cardList[reqData.index-1].splice(ci,1)
            }
          })
          roomsInfo[reqData.room].activeCard = {index:ws.index,data:reqData.data}
        })
        roomsInfo[reqData.room].clients.forEach((v,i)=>{
          v.ws.send(data)
        })
      }
      if(reqData.type==='exit'){
        try{
          roomsInfo[ws.room].clients.forEach((v,i)=>{
            if(v.ws){   //已离开玩家不再广播消息
              v.ws.send(JSON.stringify({
                type:'reset',
                data:'有玩家离开，重置对局',
                index:ws.index+1
              }))
            }
          })
          roomsInfo[ws.room].drops = false 
          roomsInfo[ws.room].ready = false 
          roomsInfo[ws.room].clients[ws.index].index = ''
          roomsInfo[ws.room].clients[ws.index].ws = ''
          roomsInfo[ws.room].clients[ws.index].ip = ''
          roomsInfo[ws.room].cardList=[]
          wss.broadcast(JSON.stringify({
            type:'init',
            total:Array.from(wss.clients).length,
            roomsInfo:filterIP(roomsInfo)
          }))
        }catch(err){
          //  console.log(err)
        } //防止ws.room未赋值时程序报错
      }
      if(reqData.type==='seat'){      //占座，当某个桌子满三人开始发牌
        var isRepeatIp = false
        roomsInfo.forEach((v,i)=>{
          v.clients.forEach((cv,ci)=>{
            if(cv.ip===req.connection.remoteAddress){
              isRepeatIp= true
            }
          }) 
        })
        // if(isRepeatIp){
        //   ws.send(JSON.stringify({
        //     type:'isRepeatIp'
        //   }))
        // }else{
          roomsInfo[reqData.room].ready = true
          roomsInfo[reqData.room].clients[reqData.index].index = reqData.index
          roomsInfo[reqData.room].clients[reqData.index].ws = ws
          roomsInfo[reqData.room].clients[reqData.index].ip = req.connection.remoteAddress
          wss.broadcast(JSON.stringify({
            type:'init',
            total:Array.from(wss.clients).length,
            roomsInfo:filterIP(roomsInfo)
          }))
          roomsInfo[reqData.room].clients.forEach((v,i)=>{
            if(v.ws){
              v.ws.index = roomsInfo[reqData.room].clients[i].index
              v.ws.room =  reqData.room
              v.ws.send(JSON.stringify({
                type:'notice',
                info:'玩家'+(reqData.index+1)+'加入房间'+(reqData.room+1)
              }))
            }
          })
          for(let i=0;i<roomsInfo[reqData.room].clients.length;i++){
            if(roomsInfo[reqData.room].clients[i].index===''){   //判断桌子是否有空位
              roomsInfo[reqData.room].ready = false
            }
          }
          if(roomsInfo[reqData.room].ready){
            // console.log((reqData.room+1)+"满3人，可以发牌了")
            roomsInfo[reqData.room].cardList= initCard(3)  //初始化三人手牌
            roomsInfo[reqData.room].bossIndex=Math.ceil(Math.random()*3)
            roomsInfo[reqData.room].cardList[roomsInfo[reqData.room].bossIndex-1]=roomsInfo[reqData.room].cardList[roomsInfo[reqData.room].bossIndex-1].concat(roomsInfo[reqData.room].cardList[3]).sort(reSort('value'))
            roomsInfo[reqData.room].clients.forEach((v,i)=>{
              v.ws.send(JSON.stringify({
                type:'notice',
                info:'房间'+(reqData.room+1)+'满三人，开始发牌'
              }))
              v.ws.send(JSON.stringify({
                type:'initCard',
                data:roomsInfo[reqData.room].cardList[i],
                index:i+1,
                room:reqData.room,
                bossCard:roomsInfo[reqData.room].cardList[3],
                bossIndex:roomsInfo[reqData.room].bossIndex
              }))
            })
          }
        }
        
      // }
     });
     ws.on('close',function reset(){
      try{
        roomsInfo[ws.room].drops = true  //该房间有人掉线
        roomsInfo[ws.room].clients[ws.index].drops=true //该座位玩家掉线
        roomsInfo[ws.room].clients.forEach((v,i)=>{
          if(!v.drops){   //已离开玩家不再广播消息
            v.ws.send(JSON.stringify({
              type:'notice',
              info:ws.index+1+'玩家掉线'
            }))
          }
        })
       }catch(err){
        //  console.log(err)
       } //防止ws.room未赋值时程序报错
     })
});
console.log("WebSocket建立完毕")