<template>
  <div class="hello">
    <theNotice ref="notice"></theNotice>
    <div class="btn" style="color:red;position:absolute;" @click="exit" v-if="!gameHall">强制退出</div>
    <div class="bottom">
        <p>当前共有{{playerNum}}人在线</p>
        <p v-show="!gameHall">您当前在{{room+1}}号桌，{{index}}号位置</p>
        <ul :style="'width:'+((bossCard.length-1)*24+100)+'px'" class="cardList" v-show="bossCard.length>0" v-if="bossCard">
          <li v-for="(item,ci) in bossCard" :class="item.isOn==true?'isOn':''" :key="ci" :style="'left:'+ci*24+'px;z-index:'+ci">
            <div :class="item|setClass" style="text-align: left;">{{item.label}}</div>
            <div class="cardBg"></div>
          </li>
        </ul>
    </div>
    <div class="gameHall" v-if="gameHall">
        <ul class="roomList">
            <li class="room" v-for="(item,i) in roomsInfo" :key="i">
                <div class="table">
                    {{i+1}}号桌
                    <div class="player" :class="v.index!==''?'disabled player'+(ci+1):'player'+(ci+1)" v-for="(v,ci) in item.clients" :key="ci" @click="seat(i,ci)">{{v.index===''?'':v.index+1}}</div>
                </div>
            </li>
        </ul>
    </div>
    <div class="playRoom" v-if="!gameHall">
      <div  class="top">
        <div class="outCont">
          <ul :style="'width:'+((outCardArr.length-1)*24+100)+'px'" class="cardList" v-show="outCardArr.length>0">
            <li v-for="(item,ci) in outCardArr" :class="item.isOn==true?'isOn':''" :key="ci" :style="'left:'+ci*24+'px;z-index:'+ci">
              <p :class="item|setClass" >{{item.label}}</p>
              <div class="cardBg"></div>
            </li>
          </ul>
        </div>
        <div class="handleList">
          <div class="outCard btn" v-show="isInit" @click="outCard" :class="activeCardArr.length>0?'':'notAllow'">出牌</div>
          <!-- <div class="notOut btn">不出</div> -->
          <!-- <div class="ready btn" v-show="isReady" @click="ready">进入</div> -->
          <div class="ready btn" v-show="!isReady&&isInit ==false" @click="ready">等待</div>
        </div>
        <ul :style="'width:'+((player.length-1)*24+100)+'px'" class="cardList">
          <li v-for="(item,ci) in player" :class="item.isOn==true?'isOn':''" :key="ci" :style="'left:'+ci*24+'px;z-index:'+ci" @click="chooseCard(ci)">
            <p :class="item|setClass" >{{item.label}}</p>
            <div class="cardBg"></div>
          </li>
        </ul>
        <p style="position:absolute;right:-140px;bottom:33px;" v-show="index==bossIndex&&index!==''">我是地主</p>
      </div>
      <div class="right" v-show="player.length>0">
          <div class="outCont">
            <ul :style="'width:'+((rightData.curData.length-1)*24+100)+'px'" class="cardList" v-show="rightData.curData.length>0">
              <li>
                <li v-for="(item,ci) in rightData.curData" :class="item.isOn==true?'isOn':''" :key="ci" :style="'left:'+ci*24+'px;z-index:'+ci">
                  <p :class="item|setClass" >{{item.label}}</p>
                  <div class="cardBg"></div>
                </li>
            </ul>
          </div>
        <ul style="height:162px;'" class="cardList">
            <li style="text-align:center;line-height:100px;">
              <p v-show="!isRightBoss"> 玩家:{{index===1?index+2:index-1}}</p>
              <p v-show="isRightBoss">地主({{index===1?index+2:index-1}})</p>
              <p>剩余：{{isRightBoss?(20-rightData.totalOut):(17-rightData.totalOut)}}</p>
            </li>
        </ul>
      </div>
      <div class="left"  v-show="player.length>0">
        <div class="outCont">
            <ul :style="'width:'+((leftData.curData.length-1)*24+100)+'px'" class="cardList" v-show="leftData.curData.length>0">
              <li>
                <li v-for="(item,ci) in leftData.curData" :class="item.isOn==true?'isOn':''" :key="ci" :style="'left:'+ci*24+'px;z-index:'+ci">
                  <p :class="item|setClass" >{{item.label}}</p>
                  <div class="cardBg"></div>
                </li>
            </ul>
          </div>
        <ul style="height:162px;'" class="cardList">
            <li style="text-align:center;line-height:100px;">
              <p v-show="!isLeftBoss">玩家:{{index===3?index-2:index+1}}</p>
              <p v-show="isLeftBoss">地主({{index===3?index-2:index+1}})</p>
              <p>剩余：{{isLeftBoss?(20-leftData.totalOut):(17-leftData.totalOut)}}</p>
            </li>
        </ul>
      </div>
    </div>
    
  </div>
</template>

<script>
import theNotice from '../components/theNotice'
import filterRole from '../assets/js/filterRole'
var ws
export default {
  components: {
    theNotice
  },
  data () {
    return {
      roomsInfo:'',
      gameHall:true, //是否在大厅
      room:'',  //玩家房间号索引值
      index:'', //玩家在当前房间的索引值
      bossIndex:'',//地主玩家
      bossCard:'',//地主牌
      playerNum:'',//大厅在线数量
      isReady:true, 
      isInit:false,
      player:[],  //玩家手牌
      activeCardArr:[], //选中的手牌
      outCardArr:[],  //玩家出的手牌
      rightData:{     
        totalOut:0,
        curData:''
      },
      leftData:{
        totalOut:0,
        curData:''
      }
    }
  },
  methods: {
    seat(i,ci){   //占座
      if(this.roomsInfo[i].clients[ci].index!==''){
        return alert('该座位已被占用')
      }
      ws.send(JSON.stringify({
        type:'seat',
        room:i,
        index:ci
      }));
      this.room = i
      this.gameHall = false
      // console.log(i,ci)
    },
    exit(){
      ws.send(JSON.stringify({
        type:'exit'
      }));
    },
    initSocket(){
      // this.isReady = false
      ws = new WebSocket('ws://localhost:8002');
      var _this = this
      ws.onopen = function(e){
          _this.notice("连接服务器成功")
          ws.send(JSON.stringify({type:'connect'}));
      }
      ws.onclose = function(e){
        _this.notice("服务器关闭")
      }
      ws.onerror = function(){
        _this.notice("连接出错");
      }
      ws.onmessage = function(e){
          var resData = JSON.parse(e.data)
          if(resData.type==='init'){
            // console.log(resData)
            _this.playerNum = resData.total
            _this.roomsInfo = resData.roomsInfo
          }
          if(resData.type==='notice'){
            _this.notice(resData.info)
          }
          if(resData.type==='NULLreconnect'){
            _this.gameHall = false
          }
          if(resData.type==='isRepeatIp'){
            _this.gameHall = true
            _this.notice('当前ip已加入房间，不能再次加入')
          }
          if(resData.type==='reconnect'){
            _this.gameHall = false
            _this.bossIndex = resData.bossIndex
            _this.bossCard = resData.bossCard
            var cardArr= JSON.parse(e.data).data
            _this.index = resData.index
            _this.room = resData.room
            _this.player = cardArr
            _this.isInit = true
            resData.cardNum.forEach(v=>{    //断线重连后计算其他玩家剩余手牌
              if(_this.index-v.index===-1||_this.index-v.index===2){
                if(_this.index-_this.bossIndex===-1||_this.index-_this.bossIndex===2||_this.index-_this.bossIndex===0){
                 _this.rightData.totalOut = 17-v.num
                }else{
                  _this.rightData.totalOut = 20-v.num
                }
              }else{
                if(_this.index-_this.bossIndex===1||_this.index-_this.bossIndex===-2||_this.index-_this.bossIndex===0){
                  _this.leftData.totalOut = 17-v.num
                }else{
                  _this.leftData.totalOut = 20-v.num
                }
              }
            })
            if(typeof(resData.activeCard)!=='undefined'){ //有出过牌
              if(_this.index-resData.activeCard.index ===1){  //短线重连获取当前出的牌
                _this.outCardArr = resData.activeCard.data
              }else if(_this.index-resData.activeCard.index === 0||_this.index-resData.activeCard.index===3){
                _this.leftData.curData = resData.activeCard.data
              }else{
                _this.rightData.curData = resData.activeCard.data
              }
            }
          }
          if(resData.type==='reset'){
            _this.resetCard(resData.index)
            _this.notice(resData.index+'号玩家退出游戏')
          }
          if(resData.type==='initCard'){
            _this.bossIndex=resData.bossIndex
            _this.bossCard=resData.bossCard
            var cardArr= JSON.parse(e.data).data
            var i = 0
            _this.index = resData.index
            _this.room = resData.room
            var t = setInterval(()=>{
              if(i+1>cardArr.length){
                _this.isInit = true
                return clearInterval(t)
              }
              _this.player.push(cardArr[i])
              i++
            },200)
          }
          if(resData.type==='outCard'){
            if(resData.index === _this.index){return}
            if(_this.index-resData.index===-1||_this.index-resData.index===2){
              _this.leftData.curData = resData.data
              _this.leftData.totalOut = _this.leftData.totalOut+resData.data.length
            }else{
              _this.rightData.curData = resData.data
              _this.rightData.totalOut = _this.rightData.totalOut+resData.data.length
            }
          }
          if(resData.type==='close'){
            _this.notice(resData.index+'玩家退出了')
          }
      }
    },
    resetCard(index){
      if(this.index===index){
        this.gameHall = true
      }
      this.bossCard = ''
      this.bossIndex=''
      this.isReady = true
      this.isInit = false
      this.player = []
      this.rightData = {
        totalOut:0,
        curData:''
      }
      this.leftData = {
        totalOut:0,
        curData:''
      }
      this.outCardArr = []
    },
    ready(){
      // ws.send(JSON.stringify({type:'ready',index:this.index}));
      // this.isReady ==true?this.initSocket():''
    },
    reSort(property){
      return function(a,b){
        var value1 = a[property];
        var value2 = b[property];
        return value2 - value1;
      }
    },
    chooseCard(i){  //选择手牌
      if(this.player[i].isOn==false){
        this.activeCardArr.push(this.player[i])
        this.activeCardArr[this.activeCardArr.length-1].id = i      //添加标识符,方便出牌的时候,从手牌移除对应id的卡牌
        this.activeCardArr = this.activeCardArr.sort(this.reSort('id'))
      }else{
        this.activeCardArr.forEach((item,index)=>{
          if(item.type == this.player[i].type&&item.value == this.player[i].value ){
            this.activeCardArr.splice(index,1)
          }
        })
        this.activeCardArr.splice(i,1)
      }
      this.player[i].isOn = !this.player[i].isOn
    },
    outCard(){    //出牌
        if(this.activeCardArr.length===0) return
        this.activeCardArr.forEach(v=>{
          this.player.splice(v.id,1)
        })
        // this.role([].concat(this.activeCardArr))
        this.outCardArr = [].concat(this.activeCardArr)
        ws.send(JSON.stringify({
          type:'outCard',
          data:this.activeCardArr,
          room:this.room,
          index:this.index
        }));
        this.activeCardArr = []
    },
    notice(info){
      this.$refs.notice.noticeInfo(info)
    },
    role(activeCardArr){
      // console.log(activeCardArr)
      var arr= []
      activeCardArr.forEach(v=>{
        arr.push(v.value)
      })
      filterRole(arr)
    }
  },
  computed: {
     isLeftBoss() {
      if(this.index-this.bossIndex===-1||this.index-this.bossIndex===2){
        return true
      }
    },
    isRightBoss(){
      if(this.index-this.bossIndex===1||this.index-this.bossIndex===-2){
        return true
      }
    }
  },
  filters: {
    setClass(item){
      if(item.type == '黑桃') return 'heitao'
      if(item.type == '红心') return 'hongxin'
      if(item.type == '梅花') return 'meihua'
      if(item.type == '方块') return 'fangkuai'
      if(item.type == '大王') return 'dawang'
      if(item.type == '小王') return 'xiaowang'
    }
  },
  mounted () {
    this.initSocket()
  }
}
</script>
<style>
.top{position: absolute;bottom: 50px;right:50%;margin-right:-250px;height: 400px;width: 500px;}
.outCont{height: 150px;}
.cardList{position: relative;height: 162px;margin: 0 auto;transition: all linear 0.2s;}
.top .handleList{padding-left: 180px;width: 400px;height: 20px;margin: 50px 0;}
 .btn{float: left;font-size: 12px;padding: 4px 10px;border-radius: 4px;border: 1px solid #ccc;margin:0 10px;cursor: pointer;}
 .btn:hover{background: wheat;}
.cardList li{list-style: none;float: left;width: 100px;height: 150px;border: 1px solid #ccc;border-radius: 6px;position: absolute;background: #fff;padding: 5px;cursor: pointer;bottom: 0;}
.top li:hover{background: #ccc;}
.top .isOn{bottom: 26px;}
p{height: 40px;background-size:12px 12px !important;}
.heitao{color: #000;background: url('../assets/img/heitao.png') no-repeat 0px 22px; }
.meihua{color: #000;background: url('../assets/img/meihua.png') no-repeat 0px 22px;}
.hongxin{color: red;background: url('../assets/img/hongxin.png') no-repeat 0px 22px; }
.fangkuai{color: red;background: url('../assets/img/fangkuai.png') no-repeat 0px 22px;}

.dawang{color: rgba(0, 0, 0, 0);background: url('../assets/img/dawang.png') ;background-size:cover; height: 100%;width: 100%; background-size:cover !important;}
.xiaowang{color: rgba(0, 0, 0, 0);background: url('../assets/img/xiaowang.png') ;background-size:cover;height: 100%;width: 100%; background-size:cover !important; }
.dawang + .cardBg{display: none;}
.xiaowang + .cardBg{display: none;}
li .cardBg{height: 100px;}
li .cardBg{background-size:60px 60px !important;}
.heitao + .cardBg{background: url('../assets/img/heitao.png') no-repeat 30px 22px;}
.meihua + .cardBg{background: url('../assets/img/meihua.png') no-repeat 30px 22px;}
.hongxin + .cardBg{background: url('../assets/img/hongxin.png') no-repeat 30px 22px;}
.fangkuai + .cardBg{background: url('../assets/img/fangkuai.png') no-repeat 30px 22px;}
.notAllow{cursor:not-allowed !important;background: #ccc !important;}

.right{position: absolute;right: 20px;top: 50%;margin-top: -80px;height: 160px;width: 160px;}
.right .cardList{width: 162px;height:162px;transition: all linear 0.2s;top:50%;transform: translateY(-50%)}
.right li{list-style: none;float: left;width: 100px;height: 152px;border: 1px solid #ccc;border-radius: 6px;position: absolute;background: #fff;padding: 5px;bottom: 0;}
.right .outCont{position:absolute;top:0;right:200px;}

.left{position: absolute;left: 20px;top: 50%;margin-top: -80px;height: 160px;width: 160px;}
.left .cardList{width: 162px;height:162px;transition: all linear 0.2s;top:50%;transform: translateY(-50%)}
.left li{list-style: none;float: left;width: 100px;height: 152px;border: 1px solid #ccc;border-radius: 6px;position: absolute;background: #fff;padding: 5px;bottom: 0;}
.left .outCont{position:absolute;top:0;left:200px;}


.table{width: 100px;height: 100px;border: 1px solid #000;border-radius: 50%;margin: 100px;position: relative;text-align: center;line-height: 100px;}
.player{width: 30px;height: 30px;border: 1px solid #000;border-radius: 50%;position: absolute;line-height: 30px;cursor: pointer;}
.player:hover{background: wheat;}
.disabled{cursor: not-allowed;}
.disabled:hover{background: #ccc;}
.player1{left:50%;top: -40px;margin-left: -15px;}
.player2{right: -30px;top: 50%;margin-top: 25px;}
.player3{left: -30px;top: 50%;margin-top: 25px;}
.roomList{width: calc(100% - 700px);margin: 0 auto;}
.roomList li{list-style-type: none;float: left;width: 260px;height: 260px;}

.bottom p{text-align: center;height: 20px !important;}
</style>
