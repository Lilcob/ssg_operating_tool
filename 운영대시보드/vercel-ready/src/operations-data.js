export const BASE_DATE='2026-10-20';
export const CATEGORIES=['지연','오늘 마감','2일 내 임박','이후','날짜 확인 필요'];
export function classify(task,base=BASE_DATE){
  if(['완료','취소'].includes(task.상태))return null;
  if(!task.마감일)return '날짜 확인 필요';
  const days=(Date.parse(`${task.마감일}T00:00:00Z`)-Date.parse(`${base}T00:00:00Z`))/86400000;
  return !Number.isFinite(days)?'날짜 확인 필요':days<0?'지연':days===0?'오늘 마감':days<=2?'2일 내 임박':'이후';
}
export function parseTasks(text){
  const rows=[];let row=[],value='',quoted=false;const input=text.replace(/^\uFEFF/,'');
  for(let i=0;i<input.length;i++){const c=input[i];if(quoted){if(c==='"'&&input[i+1]==='"'){value+='"';i++;}else if(c==='"')quoted=false;else value+=c;}else if(c==='"')quoted=true;else if(c===','){row.push(value);value='';}else if(c==='\n'){row.push(value);rows.push(row);row=[];value='';}else if(c!=='\r')value+=c;}
  if(quoted)throw new Error('준비표 CSV 인용부호를 확인하세요.');if(row.length||value){row.push(value);rows.push(row);}
  const headers=rows.shift()||[],required=['task_id','행사명','업무영역','준비항목','담당역할','마감일','상태','우선순위','확인사항','점검기준일','자료구분'],ids=new Set();
  if(required.some(h=>!headers.includes(h)))throw new Error('준비표 필수 열이 누락됐습니다.');
  return rows.filter(r=>r.some(Boolean)).map((r,i)=>{const task=Object.fromEntries(headers.map((h,j)=>[h,(r[j]||'').trim()]));if(!task.task_id||ids.has(task.task_id))throw new Error(`준비표 ${i+2}행: ID 누락/중복`);if(task.점검기준일!==BASE_DATE)throw new Error(`준비표 ${i+2}행: 기준일이 ${BASE_DATE}와 다릅니다.`);ids.add(task.task_id);return task;});
}
export function briefFacts(markdown){return markdown.split('\n').filter(l=>l.startsWith('|')).slice(2).map(l=>l.split('|').slice(1,-1).map(v=>v.trim())).filter(r=>r.length===2);}

export function boardColumns(tasks,{base=BASE_DATE,role='',area='',category=''}={}){
  const scope=tasks.filter(task=>classify(task,base)!==null&&(!role||task.담당역할===role)&&(!area||task.업무영역===area));
  return CATEGORIES.map(name=>({name,records:scope.filter(task=>classify(task,base)===name&&(!category||category===name)).sort((a,b)=>String(a.마감일).localeCompare(b.마감일)||a.task_id.localeCompare(b.task_id))}));
}

export function eventPeriod(markdown){
  const value=briefFacts(markdown).find(([key])=>key==='기간')?.[1]||'';
  const matches=[...value.matchAll(/(?:(\d{4})년\s*)?(\d{1,2})월\s*(\d{1,2})일/g)];
  if(matches.length!==2||!matches[0][1])return null;
  const iso=(year,match)=>`${year}-${match[2].padStart(2,'0')}-${match[3].padStart(2,'0')}`;
  const year=Number(matches[0][1]),start=iso(year,matches[0]);
  let end=iso(Number(matches[1][1]||year),matches[1]);
  if(!matches[1][1]&&end<start)end=iso(year+1,matches[1]);
  return {start,end};
}

export function rainyEventDays(weather,period,tasks){
  if(!period||!weather||!Array.isArray(weather.forecast))return [];
  const rainTasks=tasks.filter(task=>classify(task)!==null&&/우천|빗물|방수|우산/.test(`${task.준비항목} ${task.확인사항}`));
  return weather.forecast.filter(day=>day.date>=period.start&&day.date<=period.end&&typeof day.pop==='number'&&day.pop>=0.6&&day.pop<=1).map(day=>({date:day.date,pop:day.pop,taskIds:rainTasks.map(task=>task.task_id),mode:weather.mode,source:weather.source?.name||'출처 확인 필요',reason:weather.reason||null}));
}
