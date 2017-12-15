  //屏蔽浏览器自带右键功能
  document.oncontextmenu = function(e){
               e.preventDefault();
           };
  var injected = injected || (function() {

  // Inspector constructor
  var Inspector = function() {
    this.log = this.log.bind(this);
    this.layout = this.layout.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.$target = document.body;
    this.$cacheEl = document.body;
    this.$cacheElMain = document.body;
    this.forbidden = [this.$cacheEl, document.body, document.documentElement];
  };
  Inspector.prototype = {
    getNodes: function() {
      var path = chrome.extension.getURL("template.html");
      var xmlhttp = new XMLHttpRequest();
      xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState === 4 && xmlhttp.status === 200) {
          this.template = xmlhttp.responseText;
          this.createNodes();
          this.registerEvents();
        }
      }.bind(this);

      xmlhttp.open("GET", path, true);
      xmlhttp.send();
    },
    //验证 属性 attrname 是否 包含在itest推荐属性数组Itest_recommendation里面
    contains: function(Itest_recommendation, attrname) {
      var i = Itest_recommendation.length;
      while (i--) {
        if (Itest_recommendation[i] === attrname) {
          return true;
        }
      }
      return false;
    },
    //创建表格的tr行，包括两列 attribute 和对应value  并给每行添加一个属性“attrname+class” 高亮itest推荐行
    creatattrrow: function(attrname) {
                  var itestattrrow= document.createElement("tr");
                  itestattrrow.className = attrname+'class';
                  var attrname_td = document.createElement("td");
                  var attrvalue_td = document.createElement("td");
                   //初始化推荐数组
                  Itest_recommendation=["text","id","src","name","class","value","title","placeholder"];
                   var titlerow= document.createElement("tr");
                  if(this.contains(Itest_recommendation,attrname) )
                  {
                  itestattrrow.style="background:#00FF00";

                  }
                  attrname_td.innerText=attrname;
                  attrvalue_td.innerText="value";
                  itestattrrow.appendChild(attrname_td);
                  itestattrrow.appendChild(attrvalue_td);
                  return itestattrrow;
     },
     //获取参数组件的xpath
     readXPath: function(element) {
         if (element.id !== "") {//判断id属性，如果这个元素有id，则显 示//*[@id="xPath"]  形式内容
             return '//*[@id=\"' + element.id + '\"]';
         }
         //这里需要需要主要字符串转译问题，可参考js 动态生成html时字符串和变量转译（注意引号的作用）
         if (element == document.body) {//递归到body处，结束递归
             return '/html/' + element.tagName.toLowerCase();
         }
         var ix = 1,//在nodelist中的位置，且每次点击初始化
              siblings = element.parentNode.childNodes;//同级的子元素

         for (var i = 0, l = siblings.length; i < l; i++) {
             var sibling = siblings[i];
             //如果这个元素是siblings数组中的元素，则执行递归操作
             if (sibling == element) {
                 return arguments.callee(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix) + ']';
                 //如果不符合，判断是否是element元素，并且是否是相同元素，如果是相同的就开始累加
             } else if (sibling.nodeType == 1 && sibling.tagName == element.tagName) {
                 ix++;
             }
         }
     },
    createNodes: function() {

      this.$host = document.createElement('div');
      this.$host.className = 'tl-host';
      this.$host.style.cssText = 'all: initial;';


      this.$shadow = this.$host.createShadowRoot();
      document.body.appendChild(this.$host);

      var templateMarkup = document.createElement("div");
      templateMarkup.innerHTML = this.template;
      this.$shadow.innerHTML = templateMarkup.querySelector('template').innerHTML;

      this.$wrap = this.$shadow.querySelector('.tl-wrap');
      this.$code = this.$shadow.querySelector('.tl-code');

      //table
      this.$showattr=this.$shadow.querySelector('.tl-codeWrap');
      this.$table = document.createElement("table");

      //创建表头
      var thead = document.createElement("thead");
      var myattribute = document.createElement("th");
      myattribute.innerText="attribute";
      myattribute.className = 'theadclass';
      var myvalue = document.createElement("th");
      myvalue.innerText="value";
      myvalue.className = 'theadclass';
      thead.appendChild(myattribute);
      thead.appendChild(myvalue);

      this.$tbody = document.createElement("tbody");

      //创建表内容
      this.$ary = ["text","id","src","name","class","value","title","placeholder","xpath"];
      for(var a in this.$ary) {
          this.$tbody.appendChild(this.creatattrrow(this.$ary[a]));
      }
       this.$table.appendChild(thead);
       this.$table.appendChild(this.$tbody );
      //设置表透明度为0  暂时隐藏表格
       this.$table.style.opacity  = '0';
       this.$showattr.appendChild(this.$table);

     //获取实现组件选中效果的对象
      this.$canvas = this.$shadow.querySelector('#tl-canvas');
      this.c = this.$canvas.getContext('2d');
      this.width = this.$canvas.width = window.innerWidth;
      this.height = this.$canvas.height = window.innerHeight;
    },
    //注册事件
    registerEvents: function() {
    /*iframe可能是通过src外联的网页，不能跨域嵌入脚本
    // for 同源iframe
    var iframeArray=new Array();
    iframeArray=document.getElementsByTagName("iframe");
    try{
    for(var i=0;i<iframeArray.length;i++){
    iframeArray[i].contentWindow.oncontextmenu = function(){return false};
    iframeArray[i].contentWindow.addEventListener('contextmenu',this.log,false);
    }
  }catch(e){
  //跨域，不予提示
   alert("请使用inspetcor");
  }
  */
        window.addEventListener('contextmenu', this.log,false);
        window.addEventListener('scroll', this.layout);
        window.addEventListener('resize', function(){
        this.handleResize();
        this.layout();
      }.bind(this));
    },
    //根据属性名称  获取属性的值，没有该属性返回“”
    getattribute: function(arg) {
      try{
        returnattr=this.$target.getAttributeNode(arg).nodeValue;
      }catch(e){
      returnattr="";
      }
      return returnattr;
},
//排除隐藏元素(隐藏属性可以从父组件继承，不能判断是哪层父组件所定义)
getenableState: function(elementArry) {
var arr=[];
for(var i=0,len=elementArry.length;i<len;i++){
  arr[i]=elementArry[i];
}
for (var x=0;x<elementArry.length;x++)
 {
  //offsetParent判断父组件用display：none隐藏的组件，
  //父组件用visibility：hidden隐藏组件 ，被隐藏的子组件visibility也等于hidden
  //父组件用opacity：0隐藏组件 ，被隐藏的子组件opacity也等于1,这里无法判断
  //父组件隐藏，子组件可能覆盖定义显示属性
   if(elementArry[x].offsetParent ==null||window.getComputedStyle(elementArry[x], null).visibility=="hidden"
   ||window.getComputedStyle(elementArry[x], null).opacity=="0"||elementArry[x].style.display=="none"
   ||elementArry[x].style.visibility=="hidden"||elementArry[x].style.opacity=="0")
  {
    this.removeByValue(arr,elementArry[x]);
  }
 }
      return arr.length;
},
 removeByValue: function(arr, val) {
  for(var i=0; i<arr.length; i++) {
    if(arr[i] == val) {
      arr.splice(i, 1);
      break;
    }
  }
},
   //获取组件的text  没有则返回  “”
 getelementtext: function() {
    try{
            text=this.$target.textContent.replace(/[\n\r\s]/g, '');
          }catch(e){
          text="";
          }
          if(text!== null || text !== undefined || text !==''|| text !==' ')
          return text;
},
//根据 属性名和值返回   css选择器对应的参数值
    verificationnull: function(attrname,value) {
      if(value == null || value == undefined || value == '')
          return "";
          else
          return " "+attrname+"=\""+value+"\"";
},
//返回属性相同的组件在dom上的个数
 getelementnum: function(attrname,value) {
 //class如果包括空格，css选择器会报错。所以通过getElementsByClassName获取
   if(attrname=="class")
   // return document.getElementsByClassName(value).length;
    return this.getenableState(document.getElementsByClassName(value));
   //xpath不会有重复
   if(attrname=="xpath")
      return 1;
   //获取text相同的组件的个数
   if(attrname=="text"){
      var xpathstr="//*[text()="+"\""+value+"\""+"]";
      var xresult = document.evaluate(xpathstr, document, null, XPathResult.UNORDERED_NODE_ITERATOR_TYPE, null);
          var xnodes = [];
          var xres;
          while (xres = xresult.iterateNext()) {
              xnodes.push(xres);
          }
          return this.getenableState(xnodes);
         // return xnodes.length;
   }
   //其他属性
   var locatestr="["+attrname+"="+"'"+value+"'"+"]";
   return this.getenableState(document.querySelectorAll(locatestr));
  // return document.querySelectorAll(locatestr).length;
},
//右键响应事件
    log: function(e) {
      this.$tbody.innerHTML = "";
      for(var a in this.$ary) {
          this.$tbody.appendChild(this.creatattrrow(this.$ary[a]));
      }
      this.$target = e.target;
      // check if element cached
      if (this.forbidden.indexOf(this.$target) !== -1) return;

      var tname = this.$target.tagName;
     // itest支持的定位属性有： text();  title属性，　value属性，　placeholder属性, id属性, name属性,class属性,src属性,xpath
     var resultary=[this.getelementtext(),this.getattribute("id"),this.getattribute("src"),this.getattribute("name"),this.getattribute("class"),this.getattribute("value"),this.getattribute("title"),this.getattribute("placeholder"),"xpath:"+this.readXPath(this.$target)];
     for(var a in this.$ary) {
                var  attrrow=this.$shadow.querySelector("."+this.$ary[a]+"class");
                if(resultary[a] !== "")
                    {
                        //如果推荐属性组件>1  取消推荐并置底
                       if(this.getelementnum(this.$ary[a],resultary[a])>1){
                       attrrow.style="background-color:#FF3333";
                       this.$tbody.removeChild(attrrow);
                       this.$tbody.appendChild(attrrow);

                       }
                       //根据 class获取属性行并做对应的值替换
                       attrrow.lastChild.innerText=this.getelementnum(this.$ary[a],resultary[a])>1?resultary[a]+"  ("+this.getelementnum(this.$ary[a],resultary[a])+" components)":resultary[a];
                   }else{
                   //属性值为空的行移除
                    this.$tbody.removeChild(attrrow);
                    }
           }
           this.$table.style.opacity  = '1';
           this.$cacheEl = this.$target;
           this.layout();

    },
    // redraw overlay 高亮选中元素
    layout: function() {
      var box, computedStyle, rect;
      var c = this.c;

      rect = this.$target.getBoundingClientRect();
      computedStyle = window.getComputedStyle(this.$target);
      box = {
        width: rect.width,
        height: rect.height,
        top: rect.top,
        left: rect.left,
        margin: {
          top: computedStyle.marginTop,
          right: computedStyle.marginRight,
          bottom: computedStyle.marginBottom,
          left: computedStyle.marginLeft
        },
        padding: {
          top: computedStyle.paddingTop,
          right: computedStyle.paddingRight,
          bottom: computedStyle.paddingBottom,
          left: computedStyle.paddingLeft
        }
      };

      // pluck negatives
         ['margin', 'padding'].forEach(function(property) {
        for (var el in box[property]) {
          var val = parseInt(box[property][el], 10);
          box[property][el] = Math.max(0, val);
        }
      });

      c.clearRect(0, 0, this.width, this.height);

      box.left = Math.floor(box.left) + 1.5;
      box.width = Math.floor(box.width) - 1;

      var x, y, width, height;

      // margin
      x = box.left - box.margin.left;
      y = box.top - box.margin.top;
      width = box.width + box.margin.left + box.margin.right;
      height = box.height + box.margin.top + box.margin.bottom;

      c.fillStyle = 'rgba(255,165,0,0.5)';
      c.fillRect(x, y, width, height);

      // padding
      x = box.left;
      y = box.top;
      width = box.width;
      height = box.height;

      c.fillStyle = 'rgba(158,113,221,0.5)';
      c.clearRect(x, y, width, height);
      c.fillRect(x, y, width, height);

      // content
      x = box.left + box.padding.left;
      y = box.top + box.padding.top;
      width = box.width - box.padding.right - box.padding.left;
      height = box.height - box.padding.bottom - box.padding.top;

      c.fillStyle = 'rgba(73,187,231,0.25)';
      c.clearRect(x, y, width, height);
      c.fillRect(x, y, width, height);

      // rulers (horizontal - =)
      x = -10;
      y = Math.floor(box.top) + 0.5;
      width = this.width + 10;
      height = box.height - 1;

      c.beginPath();
      c.setLineDash([10,3]);
      c.fillStyle = 'rgba(0,0,0,0.02)';
      c.strokeStyle = 'rgba(13, 139, 201, 0.45)';
      c.lineWidth = 1;
      c.rect(x, y, width, height);
      c.stroke();
      c.fill();

      // rulers (vertical - ||)
      x = box.left;
      y = -10;
      width = box.width;
      height = this.height + 10;

      c.beginPath();
      c.setLineDash([10,3]);
      c.fillStyle = 'rgba(0,0,0,0.02)';
      c.strokeStyle = 'rgba(13, 139, 201, 0.45)';
      c.lineWidth = 1;
      c.rect(x, y, width, height);
      c.stroke();
      c.fill();
    },

    handleResize: function() {
      this.width = this.$canvas.width = window.innerWidth;
      this.height = this.$canvas.height = window.innerHeight;
    },
    activate: function() {
      this.getNodes();
    },

      deactivate: function() {
          document.removeEventListener('contextmenu', this.log);
          setTimeout(function() {
            document.body.removeChild(this.$host);
          }.bind(this), 600);
        }
      };

  var hi = new Inspector();

  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === 'activate') {
      return hi.activate();
    } else {
      return hi.deactivate();
    }
  });

  return true;
})();
