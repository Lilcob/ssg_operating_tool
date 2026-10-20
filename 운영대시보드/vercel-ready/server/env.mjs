import {readFile} from 'node:fs/promises';
export async function loadLocalEnv(){
  if(process.env.OPENWEATHER_API_KEY)return;let text;
  try{text=await readFile(new URL('../../.env.local',import.meta.url),'utf8');}catch(error){if(error.code==='ENOENT')return;throw new Error('.env.local 파일을 읽을 수 없습니다.');}
  const match=text.match(/^\s*(?:export\s+)?OPENWEATHER_API_KEY\s*=\s*(.*?)\s*$/m);
  if(match){let value=match[1];if(value.startsWith('"')&&value.endsWith('"')||value.startsWith("'")&&value.endsWith("'"))value=value.slice(1,-1);else value=value.replace(/\s+#.*$/,'').trim();process.env.OPENWEATHER_API_KEY=value;}
}
