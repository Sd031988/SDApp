'use strict';
const {app,BrowserWindow,Menu,shell,dialog,session}=require('electron');
const {isOfficialAgentUrl,externalBrowserUrl}=require('./url-policy.cjs');
const HOME='https://www.thesdhub.com/agent/index.html';
let win;
function openExternally(url){
 const target=externalBrowserUrl(url);
 if(target) shell.openExternal(target).catch(()=>{});
}
function makeMenu(){
 const template=[
  {label:'Datei',submenu:[
    {label:'SD Lotze Online öffnen',click:()=>win?.loadURL(HOME)},
    {label:'Im Standardbrowser öffnen',click:()=>openExternally(HOME)},
    {type:'separator'}, {role:'quit',label:'Beenden'}]},
  {label:'Ansicht',submenu:[
    {label:'Online-Änderungen aktualisieren',accelerator:'CmdOrCtrl+R',click:async()=>{
      if(!win)return;
      const r=await dialog.showMessageBox(win,{type:'question',buttons:['Abbrechen','Aktualisieren'],defaultId:0,
        message:'Online-Stand neu laden?',detail:'Nicht gespeicherte Eingaben können dabei verloren gehen. Die neueste Online-Version wird geladen.'});
      if(r.response===1){await win.webContents.session.clearCache();win.loadURL(HOME)}
    }},
    {role:'zoomIn'}, {role:'zoomOut'}, {role:'resetZoom'}, {role:'togglefullscreen'}]},
  {label:'Hilfe',submenu:[
    {label:'Online-Hilfe öffnen',click:()=>openExternally(HOME)},
    {label:'Zur PC-Version',click:()=>openExternally(HOME)}]}
 ];
 Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
function createWindow(){
 win=new BrowserWindow({
  width:1180,height:800,minWidth:680,minHeight:500,
  title:'SD Lotze Online – immer die aktuelle Webversion',
  webPreferences:{nodeIntegration:false,contextIsolation:true,sandbox:true,webSecurity:true,
    webviewTag:false,allowRunningInsecureContent:false,partition:'persist:sd-lotze-online'}
 });
 win.webContents.setWindowOpenHandler(({url})=>{
  openExternally(url);
  return {action:'deny'};
 });
 win.webContents.on('will-navigate',(event,url)=>{
  if(!isOfficialAgentUrl(url)){event.preventDefault();openExternally(url)}
 });
 win.webContents.on('will-redirect',(event,url)=>{
  if(!isOfficialAgentUrl(url)){event.preventDefault();openExternally(url)}
 });
 win.webContents.on('will-attach-webview',e=>e.preventDefault());
 win.webContents.on('did-fail-load',(_event,code,description,_url,isMainFrame)=>{
  if(isMainFrame&&code!==-3&&win&&!win.isDestroyed())
   dialog.showMessageBox(win,{type:'warning',message:'Verbindung zu SD Lotze fehlgeschlagen',
     detail:'Die PC-Online-Version braucht eine Internetverbindung. Bitte die Verbindung prüfen und über Ansicht → Online-Änderungen aktualisieren erneut laden.\n'+description}).catch(()=>{});
 });
 win.loadURL(HOME);
}
app.whenReady().then(async()=>{
 const pageSession=session.fromPartition('persist:sd-lotze-online');
 // Load fresh online assets each time the desktop app starts.
 await pageSession.clearCache();
 // All powerful system permissions are denied by default, except an explicit
 // microphone request by the official web agent for speech input.
 pageSession.setPermissionRequestHandler((contents,permission,callback,details)=>{
  const origin=details?.requestingUrl||contents.getURL();
  const types=details?.mediaTypes||[];
  callback(permission==='media'&&isOfficialAgentUrl(origin)&&types.includes('audio')&&!types.includes('video'));
 });
 makeMenu();
 createWindow();
 app.on('activate',()=>{if(BrowserWindow.getAllWindows().length===0)createWindow()});
});
app.on('window-all-closed',()=>{if(process.platform!=='darwin')app.quit()});
