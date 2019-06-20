function getWordCnt(arr){ 
    return arr.reduce(function(prev,next){ 
            prev[next] = (prev[next] + 1) || 1; 
            return prev; 
          },{}) 
  } 
function getObjlength(arr){
    return Object.getOwnPropertyNames(getWordCnt(arr)).length
}

function dan(arr){
    return {
        rule:true,
        type:'dan',
        value:arr[0]
    }
}
function shuang(arr){
    if(arr[0]===arr[1]){    //对子
        return{
            rule:true,
            type:'shuang',
            value:arr[0]
        }
    }
    else if(arr[0]===50&&arr[1]===100){ //王炸
        return{
            rule:true,
            type:'zhadan',
            value:arr[0]*arr[1]
        }
    }
    else{                   //不符合规则
        return {
            rule:false
        }
    }
}
function three(arr){  //三，三带一，三带一对
    // return{
    //     rule:true,
    //     type:'zhadan',
    //     value:arr[0]*arr[1]
    // }
}
function zhadan(arr){      //四张牌的炸弹
    return{
        rule:true,
        type:'zhadan',
        value:arr[0]
    }
}
function sidai(obj){    //四带一，四带2，四带两队
    return{
        rule:true,
        type:'sidai'+obj.type,
        value:obj.value
    }
}
export default function filterRole(arr){
    var n = arr.length
    if(n===1) return dan(arr)
    if(n===2) return shuang(arr)
    if(n===3){
        if(getObjlength(arr)===1){
            return three(arr)
        }else{
            return {rule:false}
        }
    }
    if(n===4){
        if(getObjlength(arr)===1){
            return zhadan(arr)
        }else if(getObjlength(arr)===2){
            return three(arr)
        }else{
            return {rule:false}
        }
    }
    if(n===5){
        if(getObjlength(arr)===2){
            var obj = getWordCnt(arr)
            for(var v in obj){
                console.log(v,obj[v])
                if(obj[v]===4){
                    return sidai({
                        value:v,
                        type:1
                    })
                }
            }
        }else if(getObjlength(arr)===5){

        }
    }
}