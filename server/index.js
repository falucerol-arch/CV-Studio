import http from 'node:http';
import { randomBytes, createHash, timingSafeEqual } from 'node:crypto';

const port = Number(process.env.API_PORT || 4174);
const frontEndUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const redirectUri = process.env.CANVA_REDIRECT_URI || `http://localhost:${port}/api/canva/callback`;
const states = new Map();
let token = null; // Single-user local development. Production needs per-user encrypted token storage.

const send = (res, status, body, headers={}) => {
  res.writeHead(status, { 'content-type':'application/json; charset=utf-8', 'cache-control':'no-store', ...headers });
  res.end(JSON.stringify(body));
};
const readBody = req => new Promise((resolve,reject)=>{let data='';req.on('data',chunk=>{data+=chunk;if(data.length>1e6)reject(new Error('Request too large'))});req.on('end',()=>{try{resolve(JSON.parse(data||'{}'))}catch{reject(new Error('Invalid JSON'))}});req.on('error',reject)});
const b64url = bytes => Buffer.from(bytes).toString('base64url');
const credentialsReady = () => Boolean(process.env.CANVA_CLIENT_ID && process.env.CANVA_CLIENT_SECRET);
const same = (a,b) => { const aa=Buffer.from(String(a)),bb=Buffer.from(String(b));return aa.length===bb.length&&timingSafeEqual(aa,bb); };

async function api(path, options={}) {
  if (!token?.accessToken) throw new Error('Conecta Canva para continuar.');
  if (token.expiresAt < Date.now()+60_000 && token.refreshToken) {
    const body=new URLSearchParams({grant_type:'refresh_token',refresh_token:token.refreshToken});
    const refreshed=await fetch('https://api.canva.com/rest/v1/oauth/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body});
    const data=await refreshed.json();if(!refreshed.ok)throw new Error(data.message||'No se pudo renovar la conexión Canva.');
    token={accessToken:data.access_token,refreshToken:data.refresh_token||token.refreshToken,expiresAt:Date.now()+(data.expires_in||14400)*1000};
  }
  const response=await fetch(`https://api.canva.com/rest/v1${path}`,{...options,headers:{Authorization:`Bearer ${token.accessToken}`,'Content-Type':'application/json',...(options.headers||{})}});
  const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.message||`Canva respondió ${response.status}.`);return data;
}

const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
  try {
    if(req.method==='GET'&&url.pathname==='/api/canva/status')return send(res,200,{configured:credentialsReady(),connected:Boolean(token?.accessToken)});
    if(req.method==='GET'&&url.pathname==='/api/canva/connect'){
      if(!credentialsReady())return send(res,503,{error:'Configura CANVA_CLIENT_ID y CANVA_CLIENT_SECRET en el servidor para habilitar Canva.'});
      const verifier=b64url(randomBytes(48)),state=b64url(randomBytes(32)),challenge=b64url(createHash('sha256').update(verifier).digest());states.set(state,{verifier,created:Date.now()});
      for(const [k,v] of states)if(Date.now()-v.created>10*60_000)states.delete(k);
      const auth=new URL('https://www.canva.com/api/oauth/authorize');auth.searchParams.set('client_id',process.env.CANVA_CLIENT_ID);auth.searchParams.set('response_type','code');auth.searchParams.set('redirect_uri',redirectUri);auth.searchParams.set('scope','design:meta:read design:content:read');auth.searchParams.set('state',state);auth.searchParams.set('code_challenge',challenge);auth.searchParams.set('code_challenge_method','s256');
      const secure=redirectUri.startsWith('https:')?'; Secure':'';
      res.writeHead(302,{Location:auth.toString(),'Cache-Control':'no-store','Set-Cookie':`cv_canva_state=${state}; HttpOnly; SameSite=Lax; Path=/api/canva/callback; Max-Age=600${secure}`});return res.end();
    }
    if(req.method==='GET'&&url.pathname==='/api/canva/callback'){
      const state=url.searchParams.get('state'),code=url.searchParams.get('code'),saved=states.get(state);states.delete(state);
      const stateCookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cv_canva_state='))?.slice('cv_canva_state='.length);
      const clearCookie='cv_canva_state=; HttpOnly; SameSite=Lax; Path=/api/canva/callback; Max-Age=0';
      if(!saved||!code||!same(state,stateCookie)){res.writeHead(302,{Location:`${frontEndUrl}/?canva=error`,'Set-Cookie':clearCookie});return res.end();}
      const body=new URLSearchParams({grant_type:'authorization_code',code,code_verifier:saved.verifier,redirect_uri:redirectUri});
      const response=await fetch('https://api.canva.com/rest/v1/oauth/token',{method:'POST',headers:{Authorization:`Basic ${Buffer.from(`${process.env.CANVA_CLIENT_ID}:${process.env.CANVA_CLIENT_SECRET}`).toString('base64')}`,'Content-Type':'application/x-www-form-urlencoded'},body});
      const data=await response.json();if(!response.ok)throw new Error(data.message||'Canva no completó la autorización.');
      token={accessToken:data.access_token,refreshToken:data.refresh_token,expiresAt:Date.now()+(data.expires_in||14400)*1000};res.writeHead(302,{Location:`${frontEndUrl}/?canva=connected`,'Cache-Control':'no-store','Set-Cookie':clearCookie});return res.end();
    }
    if(req.method==='POST'&&url.pathname==='/api/canva/disconnect'){token=null;return send(res,200,{connected:false});}
    if(req.method==='GET'&&url.pathname==='/api/canva/designs'){
      if(!token?.accessToken)return send(res,401,{error:'Conecta Canva para ver tus diseños.'});
      const query=new URLSearchParams({limit:'100',sort_by:'modified_descending'});if(url.searchParams.get('query'))query.set('query',url.searchParams.get('query'));
      return send(res,200,await api(`/designs?${query}`));
    }
    if(req.method==='POST'&&url.pathname==='/api/canva/export'){
      const {designId}=await readBody(req);if(!designId)return send(res,400,{error:'Falta el identificador del diseño.'});
      const created=await api('/exports',{method:'POST',body:JSON.stringify({design_id:designId,format:{type:'pdf'}})});let result=created;
      for(let i=0;i<24;i++){if(result.job?.status==='success')break;if(result.job?.status==='failed')throw new Error('Canva no pudo exportar este diseño.');await new Promise(r=>setTimeout(r,1250));result=await api(`/exports/${created.job?.id}`)}
      const downloadUrl=result.job?.urls?.[0];if(!downloadUrl)return send(res,504,{error:'La exportación sigue procesándose. Inténtalo de nuevo en unos momentos.'});
      return send(res,200,{downloadUrl});
    }
    return send(res,404,{error:'Ruta no encontrada.'});
  } catch(error){return send(res,500,{error:error.message||'Error al comunicarse con Canva.'})}
});
server.listen(port,()=>console.log(`CV Studio Canva API disponible en http://localhost:${port}`));
