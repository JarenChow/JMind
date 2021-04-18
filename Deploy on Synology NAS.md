
**前置条件**
1.	在套件中心中安装好Web Statiion 和 PHP 7.2;  
 ![image](https://user-images.githubusercontent.com/3627812/115139720-0707eb80-a066-11eb-8b62-d8646a2a7e9f.png)



2.	有公网ip，有域名，且有https证书;
3.	知道如何设置端口转发.

**安装步骤**
1.	Web 目录下新建JMind文件夹，将本项目的index和xmind.js 文件上传到JMind目录下。

 ![image](https://user-images.githubusercontent.com/3627812/115139732-18e98e80-a066-11eb-8688-cf444e4e7d19.png)


2.	在群晖套件中打开web station，在虚拟机中新增，按如下进行配置。端口号可以自行定义.  
  ![image](https://user-images.githubusercontent.com/3627812/115139701-ee97d100-a065-11eb-80e2-fd958a801c8a.png)
3.	设置好端口转发，访问 https:// your_domain_name:7780 或者 https://your_NAS_ip:7780, 就可以看到如下页面了。 Enjoy it.  
 ![image](https://user-images.githubusercontent.com/3627812/115139735-20109c80-a066-11eb-9afc-fc442632ddbf.png)

