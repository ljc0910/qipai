function reSort(property){
    return function(a,b){
      var value1 = a[property];
      var value2 = b[property];
      return value2 - value1;
    }
}
function Card(){
    var type = ['黑桃','红心','梅花','方块']
    var nume = [
    {label:'A',value:14},
    {label:'2',value:16},
    {label:'3',value:3},
    {label:'4',value:4},
    {label:'5',value:5},
    {label:'6',value:6},
    {label:'7',value:7},
    {label:'8',value:8},
    {label:'9',value:9},
    {label:'10',value:10},
    {label:'J',value:11},
    {label:'Q',value:12},
    {label:'K',value:13}]
    var All = []
      type.forEach(v=>{
        nume.forEach(cv=>{
          All.push({
            type:v,
            label:cv.label,
            value:cv.value,
            isOn:false
          })
        })
      })
      All.push({
        type:'大王',
        label:'大王',
        value:100,
        isOn:false
      })
      All.push({
        type:'小王',
        label:'小王',
        value:50,
        isOn:false
      })
      return All
  }
  module.exports = function initCard(num){ //初始化手牌
    var AllCard = Card()
    var player = []
    for(var i=0;i<num;i++){
      player.push([])
      for(var j=0;j<(51/num);j++){
        var n = Math.floor(Math.random()*AllCard.length)
        player[i].push(AllCard[n])
        AllCard.splice(n,1)
      }
    }
    player.push(AllCard)
    AllCard=[]
    for(var i=0;i<player.length;i++){
      player[i]=player[i].sort(reSort('value'))
    }
    return player
}