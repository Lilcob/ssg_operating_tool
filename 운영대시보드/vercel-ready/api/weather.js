// Vercel Node function; never imported in client code.
let service;
module.exports=async function handler(request,response){
  response.setHeader('Cache-Control','no-store');
  if(request.method!=='GET'){response.setHeader('Allow','GET');return response.status(405).json({error:'GET only'});}
  service ||= import('../server/weather.mjs');
  try{const {getWeather}=await service;const mode=new URL(request.url,'http://localhost').searchParams.get('mode')||'sample';if(!['sample','live'].includes(mode))return response.status(400).json({error:'mode must be sample or live'});return response.status(200).json(await getWeather(mode));}
  catch{return response.status(503).json({error:'날씨 예제 자료를 읽을 수 없습니다.'});}
};
