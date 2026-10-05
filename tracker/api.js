/* Authentication stays in this tab's session storage, never in query strings. */
const SESSION='miro_pilot_session';
const origin=['127.0.0.1','localhost'].includes(location.hostname)?location.origin:'https://api.miconnects.in';
let token=sessionStorage.getItem(SESSION), expired=()=>{};
export class RequestError extends Error {
  constructor(message,status=0){super(message);this.status=status;}
}
export function onExpired(callback){expired=callback;}
export function signedIn(){return Boolean(token);}
export function signOut(){token=null;sessionStorage.removeItem(SESSION);sessionStorage.removeItem('miro_feedback_draft');}
export async function request(path,body,namespace='pilot') {
  const checking=path.endsWith('/check')&&(namespace==='linkedin'||path.startsWith('/sends/'));
  let response;
  try {
    response=await fetch(origin+'/api/'+namespace+path,{method:body===undefined?'GET':'POST',cache:'no-store',headers:{'Content-Type':'application/json','Cache-Control':'no-cache',...(token?{Authorization:'Bearer '+token}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  } catch {throw new RequestError('Could not connect. Your form is still here; try again shortly.');}
  let result;try{result=await response.json();}catch{throw new RequestError('Could not read the response. Refresh or try again shortly.',response.status);}
  if(!response.ok){
    if(response.status===401){signOut();expired();}
    // Internal diagnostics and supplier names do not belong in the candidate UI.
    const message=response.status===401?'Your session expired. Open My jobs & activity from the extension again.':response.status===403?'This account cannot access activity right now. Check your access in the extension.':response.status===409?'This record changed. Close the editor, refresh, and review it again.':response.status===422?(Array.isArray(result.detail)&&result.detail.some(e=>e.loc?.includes('url'))?'Use a public HTTPS job link.':'Check the required fields and their lengths.'):response.status===404?'This item is unavailable. Refresh your activity and try again.':'Could not save or refresh. Your form is preserved; try again shortly.';
    const detail=typeof result.detail==='string'?result.detail:'';
    const reconnect=response.status===409&&(detail.startsWith('Reconnect Google')||detail.startsWith('Reconnect Gmail'));
    const checkMessage=response.status===429?'A check is already running or the check limit was reached. Try again shortly.':response.status===409&&namespace==='linkedin'?'Resume or reconnect LinkedIn before checking this conversation.':response.status===503?`${namespace==='linkedin'?'LinkedIn':'Gmail'} check unavailable. Earlier observations retained; try again later.`:message;
    throw new RequestError(reconnect?'Reconnect Gmail in the extension and grant read access, then check again.':checking?checkMessage:message,response.status);
  }
  return result;
}
export async function authenticate() {
  const params=new URLSearchParams(location.hash.slice(1));
  const code=params.get('code'), requested=params.get('view');
  // Strip the one-use code before requests, rendering, links or view navigation.
  history.replaceState(null,'',location.pathname+location.search);
  if(code){const response=await request('/session',{code});token=response.token;sessionStorage.setItem(SESSION,token);}
  return requested;
}
