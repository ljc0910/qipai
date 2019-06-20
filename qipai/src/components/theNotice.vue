<template>
    <div class="notice">
        <p v-for="(v,i) in infoList" :key='i'>
            {{v}}
        </p>
    </div>
</template>
<script>
export default {
    data () {
        return {
            infoList:[]      
        }
    },
    methods: {
        noticeInfo(info){
            this.infoList.unshift(info)
        }
    }
}
</script>

<style>
.notice{width: 350px;height: 200px;border: 1px solid #ccc;position: absolute;right: 0;top: 0;overflow-y: auto;}
.notice p{height: 20px;font-size: 14px;}
</style>
