import {readFile} from 'node:fs/promises';
export const CACHE_MS=600000,TIMEOUT_MS=5000;
const location={id:'seoul',name:'서울 중구 참고 좌표',note:'예제A점의 실제 위치가 아닙니다.',lat:37.5636,lon:126.9828,timezone:'Asia/Seoul'};
const messages={'selected-sample':'예제 모드를 선택했습니다.','missing-key':'서버에 OPENWEATHER_API_KEY가 설정되지 않았습니다.','unauthorized':'OpenWeather 인증에 실패했습니다. 서버 키를 확인하세요.','rate-limited':'OpenWeather 요청 한도를 초과했습니다.','timeout':'OpenWeather 응답이 제한 시간 5초를 초과했습니다.','upstream-error':'OpenWeather 서버 호출에 실패했습니다.','invalid-response':'OpenWeather 응답 형식이나 예보 데이터가 올바르지 않습니다.','network-error':'OpenWeather 네트워크 연결에 실패했습니다.'};
const day=s=>new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Seoul',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(s*1000));
function number(n){if(typeof n!=='number'||!Number.isFinite(n))throw new Error('invalid-response');return n;}
function fields(item){const c=item.weather?.[0];if(!c||typeof c.description!=='string')throw new Error('invalid-response');return {temp:number(item.main?.temp),feelsLike:number(item.main?.feels_like),humidity:number(item.main?.humidity),wind:number(item.wind?.speed),description:c.description,conditionId:number(c.id)};}
export function normalizeWeather(current,forecast,now){
  const currentFields=fields(current),observedAt=new Date(number(current.dt)*1000).toISOString();
  if(!Array.isArray(forecast.list)||!forecast.list.length)throw new Error('invalid-response');
  const groups=new Map();
  for(const item of forecast.list){const date=day(number(item.dt)),c=fields(item),min=number(item.main.temp_min),max=number(item.main.temp_max),pop=number(item.pop);if(min>max||pop<0||pop>1)throw new Error('invalid-response');if(!groups.has(date))groups.set(date,{date,min,max,pop,description:c.description,conditionId:c.conditionId,slots:0});const g=groups.get(date);g.min=Math.min(g.min,min);g.max=Math.max(g.max,max);g.pop=Math.max(g.pop,pop);g.slots++;}
  const days=[...groups.values()].filter(g=>g.date>=day(now/1000)).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);if(days.length<5)throw new Error('invalid-response');
  return {mode:'live',status:'실시간 날씨',reason:null,message:'OpenWeather 현재 날씨와 3시간 예보를 날짜별로 집계했습니다.',location,source:{name:'OpenWeather · 현재 날씨 / 5일·3시간 예보',url:'https://openweathermap.org/'},fetchedAt:new Date(now).toISOString(),observedAt,current:currentFields,forecast:days,cached:false};
}
export async function loadSample(){return JSON.parse(await readFile(new URL('../dist/data/11_날씨응답_예제.json',import.meta.url),'utf8'));}
export function createWeatherService({fetchImpl=globalThis.fetch,now=Date.now,getKey=()=>process.env.OPENWEATHER_API_KEY,timeoutMs=TIMEOUT_MS,sampleLoader=loadSample}={}){
  let cached=null,pending=null,failure=null;
  async function sample(reason){return {...await sampleLoader(),reason,message:messages[reason]||messages['network-error'],requestedAt:new Date(now()).toISOString(),cached:false};}
  async function request(){const controller=new AbortController();let timer;try{
    const query=new URLSearchParams({lat:String(location.lat),lon:String(location.lon),units:'metric',lang:'kr',appid:getKey().trim()});
    const work=Promise.all(['weather','forecast'].map(async endpoint=>{const response=await fetchImpl(`https://api.openweathermap.org/data/2.5/${endpoint}?${query}`,{signal:controller.signal,redirect:'error'});if(!response.ok)throw new Error(response.status===401||response.status===403?'unauthorized':response.status===429?'rate-limited':'upstream-error');try{return await response.json();}catch{throw new Error('invalid-response');}}));
    const timeout=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('timeout'));},timeoutMs);});
    const [current,forecast]=await Promise.race([work,timeout]);cached=normalizeWeather(current,forecast,now());failure=null;return {...cached,requestedAt:new Date(now()).toISOString()};
  }catch(error){controller.abort();const reason=error.name==='AbortError'?'timeout':Object.hasOwn(messages,error.message)?error.message:'network-error';failure={reason,at:now()};return sample(reason);}finally{clearTimeout(timer);}}
  return async function getWeather(mode='sample'){if(mode!=='live')return sample('selected-sample');if(!getKey()?.trim())return sample('missing-key');if(cached&&now()-Date.parse(cached.fetchedAt)<CACHE_MS)return {...cached,cached:true,requestedAt:new Date(now()).toISOString()};if(failure&&now()-failure.at<30000)return sample(failure.reason);if(!pending)pending=request().finally(()=>{pending=null;});return pending;};
}
export const getWeather=createWeatherService();
