import {BASE_DATE,CATEGORIES,classify,parseTasks,briefFacts,boardColumns,eventPeriod,rainyEventDays} from './operations-data.js';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=s=>document.querySelector(s);
const storageKey=id=>`momentroom-operation-${id}`;
const saved=new Map();let tasks=[],period=null,latestWeather=null;
const baseDate=()=>$('#task-base')?.value||BASE_DATE;
function notice(message){$('#operations-storage').textContent=message;}
function readSaved(id){
  if(saved.has(id))return saved.get(id);
  let item={checked:false,memo:''};
  try{const raw=JSON.parse(localStorage.getItem(storageKey(id))||'null');if(raw&&typeof raw==='object')item={checked:raw.checked===true,memo:typeof raw.memo==='string'?raw.memo:''};}
  catch{notice('브라우저 저장소를 읽지 못했습니다. 확인·메모는 현재 화면에서만 유지됩니다.');}
  saved.set(id,item);return item;
}
function save(id,patch){const item={...readSaved(id),...patch};saved.set(id,item);try{localStorage.setItem(storageKey(id),JSON.stringify(item));notice('확인 체크·메모를 task_id별로 이 브라우저에 저장했습니다. 팀과 공유되지 않으며 원본 상태를 바꾸지 않습니다.');}catch{notice('브라우저 저장 실패: 확인·메모는 현재 화면에서만 유지됩니다. 새로고침 시 사라질 수 있습니다.');}}
function renderTasks(){
  const role=$('#task-role').value,area=$('#task-area').value,category=$('#task-category').value,base=baseDate();
  const columns=boardColumns(tasks,{base,role,area,category});
  const active=tasks.filter(t=>classify(t,base)!==null),count=columns.reduce((n,c)=>n+c.records.length,0);
  $('#task-summary').textContent=`점검 기준 ${base} · ${role||'전체 담당'} · 전체 ${tasks.length}건 중 완료·취소 ${tasks.length-active.length}건 제외 · 현재 미완료 ${count}건`;
  $('#marketing-only').setAttribute('aria-pressed',String(role==='마케팅 담당'));
  $('#board-overview').innerHTML=columns.map((column,index)=>`<button data-board-column="${index}" class="board-jump">${column.name} <b>${column.records.length}</b></button>`).join('');
  $('#task-list').innerHTML=columns.map((column,index)=>`<section class="board-column" aria-label="${column.name} 준비 항목"><header class="board-column-heading category-${index}"><h3>${column.name}</h3><span>${column.records.length}건</span></header><div class="board-column-cards">${column.records.length?column.records.map(task=>{
    const local=readSaved(task.task_id);
    return `<article class="board-card" data-card-id="${esc(task.task_id)}"><button class="card-open" data-open-task="${esc(task.task_id)}" aria-label="${esc(task.task_id)} ${esc(task.준비항목)} 상세 열기"><span class="record-id">${esc(task.task_id)}</span><h4>${esc(task.준비항목)}</h4><span class="card-role">${esc(task.담당역할)}</span><span class="card-due">마감 ${esc(task.마감일||'날짜 확인 필요')}</span><small>원본 상태 · ${esc(task.상태)}</small></button><label class="task-check"><input type="checkbox" data-check="${esc(task.task_id)}" aria-label="${esc(task.task_id)} 확인" ${local.checked?'checked':''}> 확인</label><label class="task-memo-label">내 메모<textarea rows="2" maxlength="1000" data-task-memo="${esc(task.task_id)}" aria-label="${esc(task.task_id)} 운영 메모" placeholder="이 항목에 메모 남기기">${esc(local.memo)}</textarea></label></article>`;
  }).join(''):`<p class="board-empty">${category&&category!==column.name?'분류 필터로 숨김':'준비 항목 없음'}</p>`}</div></section>`).join('');
  $('#task-list').querySelectorAll('[data-check]').forEach(input=>input.addEventListener('change',()=>save(input.dataset.check,{checked:input.checked})));
  $('#task-list').querySelectorAll('[data-task-memo]').forEach(input=>input.addEventListener('input',()=>save(input.dataset.taskMemo,{memo:input.value})));
  bindTaskLinks($('#task-list'));
  $('#board-overview').querySelectorAll('[data-board-column]').forEach(button=>button.addEventListener('click',()=>$('#task-list').children[Number(button.dataset.boardColumn)].scrollIntoView({block:'nearest',inline:'start'})));
}
function bindTaskLinks(container){container.querySelectorAll('[data-open-task]').forEach(button=>button.addEventListener('click',()=>openTask(button.dataset.openTask,button.dataset.rainContext||'')));}
function openTask(id,context=''){
  const task=tasks.find(item=>item.task_id===id);if(!task)return;
  const local=readSaved(id),role=$('#task-role').value;
  $('#task-detail-content').innerHTML=`<p class="eyebrow">준비 항목 상세 · 점검 기준 ${baseDate()}</p><h2 id="task-detail-title">${esc(task.준비항목)}</h2><p class="detail-id">${esc(task.task_id)} · ${esc(task.업무영역)}</p>${context?`<p class="rain-detail-context">${esc(context)}</p>`:''}<dl class="task-detail-facts"><div><dt>마감</dt><dd>${esc(task.마감일||'날짜 확인 필요')}</dd></div><div><dt>담당 역할</dt><dd>${esc(task.담당역할)}</dd></div><div><dt>기한 분류</dt><dd>${esc(classify(task,baseDate())||task.상태)}</dd></div><div><dt>원본 상태</dt><dd>${esc(task.상태)}</dd></div><div><dt>원본 점검일</dt><dd>${esc(task.점검기준일)}</dd></div></dl><p class="detail-scope">보드 담당 필터: ${esc(role||'전체 담당')} · 필터를 유지한 채 관련 항목을 열었습니다.</p><h3>확인사항</h3><p class="detail-confirmation">${esc(task.확인사항)}</p><label class="task-check detail-check"><input id="detail-check" type="checkbox" aria-label="${esc(id)} 상세 확인" ${local.checked?'checked':''}> 이 항목 확인</label><label class="task-memo-label">내 메모<textarea id="detail-memo" rows="4" maxlength="1000" aria-label="${esc(id)} 상세 메모">${esc(local.memo)}</textarea></label><p class="source-note">확인·메모는 이 브라우저에 저장합니다. 원본 상태는 변경하지 않습니다.<br>출처: C_행사준비/08_행사준비.csv · ${esc(task.task_id)}</p>`;
  $('#detail-check').addEventListener('change',event=>save(id,{checked:event.target.checked}));
  $('#detail-memo').addEventListener('input',event=>save(id,{memo:event.target.value}));
  $('#task-detail').showModal();
}
function rainMarkup(){
  if(!period||!latestWeather)return '<p>행사 기간과 날씨를 확인하는 중입니다.</p>';
  const days=rainyEventDays(latestWeather,period,tasks),live=latestWeather.mode==='live';
  return `<div class="rain-heading"><h3>우천 준비 연결</h3><span class="source-badge ${live?'live':'sample'}">${live?'실제 OpenWeather':'예제 · 실제 예보 아님'}</span></div><p>행사 ${period.start} ~ ${period.end} · 강수확률 60% 이상인 날짜</p>${days.length?days.map(day=>`<article class="rain-alert"><strong>${day.date} · 강수확률 ${Math.round(day.pop*100)}%</strong><p>${esc(day.source)}</p>${day.taskIds.length?day.taskIds.map(id=>{const task=tasks.find(t=>t.task_id===id),context=`${live?'실제 예보':'예제 예보'} ${day.date} · 강수확률 ${Math.round(day.pop*100)}% · 출처: ${day.source}`;return `<button class="button primary" data-open-task="${esc(id)}" data-rain-context="${esc(context)}">${esc(id)} ${esc(task.준비항목)} 열기</button>`;}).join(''):'<p>연결할 미완료 우천 준비 항목이 없습니다.</p>'}</article>`).join(''):'<p>현재 수신한 예보 중 행사 기간에 겹치는 60% 이상 날짜가 없습니다. 예보 범위 밖 날짜의 비가 없다는 뜻은 아닙니다.</p>'}<small>출처: ${esc(latestWeather.source?.name)} · ${latestWeather.reason?`사유: ${esc(latestWeather.reason)} · `:''}자료 조회 ${when(latestWeather.fetchedAt)}<br>관련 업무는 보드 담당 필터와 관계없이 열 수 있습니다. 점포 실제 위치가 아닌 서울 중구 참고 좌표입니다.</small>`;
}
function renderRainAlerts(){for(const id of ['operations-rain','weather-rain']){const container=$('#'+id);if(container){container.innerHTML=rainMarkup();bindTaskLinks(container);}}}
async function getText(file){const res=await fetch(`./data/${encodeURIComponent(file)}`);if(!res.ok)throw new Error(`${file} 불러오기 실패`);return res.text();}
const when=value=>{const d=new Date(value);return value&&!Number.isNaN(d.getTime())?new Intl.DateTimeFormat('ko-KR',{timeZone:'Asia/Seoul',dateStyle:'medium',timeStyle:'medium',hour12:false}).format(d)+' (KST)':'확인 필요';};
function displayWeather(w){
  latestWeather=w;
  const live=w.mode==='live';
  $('#weather-result').innerHTML=`<div class="weather-status ${live?'live':'sample'}"><strong>${esc(w.status)}</strong><span>${live?'실제 제공자 응답':'예제 · 실제 관측·예보 아님'}</span></div><p class="weather-reason">${esc(w.message)}${w.reason?` · 사유: ${esc(w.reason)}`:''}</p><p>${esc(w.location?.name)} · ${esc(w.location?.note)}</p><div class="weather-now"><strong>${esc(w.current.temp)}°C</strong><span>${esc(w.current.description)}<small>체감 ${esc(w.current.feelsLike)}°C · 습도 ${esc(w.current.humidity)}% · 바람 ${esc(w.current.wind)}m/s</small></span></div><div class="weather-days">${w.forecast.map(d=>`<article><b>${esc(d.date)}</b><span>${esc(d.description)}</span><strong>${esc(d.min)}° / ${esc(d.max)}°</strong><small>강수확률 ${Math.round(d.pop*100)}% · ${esc(d.slots)}개 시간대</small></article>`).join('')}</div><p class="weather-source">출처: ${esc(w.source?.name)}${live?' · <a href="https://openweathermap.org/" target="_blank" rel="noopener noreferrer">OpenWeather</a>':''}<br>서버 요청 시각: ${when(w.requestedAt)}<br>${live?'제공자 조회 시각':'예제 자료에 기록된 조회 시각'}: ${when(w.fetchedAt)}<br>${live?'현재 관측 시각':'예제 관측 시각'}: ${when(w.observedAt)}<br>${w.cached?'서버 캐시 사용 · 최초 조회 후 10분 이내':'캐시 미사용'} · 날짜·시각 기준: Asia/Seoul</p><p class="weather-note">${live?'5일·3시간 예보의 첫 5개 날짜를 집계했습니다. 최저·최고는 수신한 시간대 기준이며 첫날·마지막 날은 하루 전체가 아닐 수 있습니다.':'예제 날짜와 수치는 고정된 교육 자료입니다. 실제 날씨로 사용하지 마세요.'}</p>`;
  renderRainAlerts();
}
async function refreshWeather(){
  const button=$('#weather-refresh'),mode=$('#weather-mode').value;button.disabled=true;$('#weather-result').setAttribute('aria-busy','true');
  $('#weather-request-state').textContent='날씨를 확인하는 중입니다.';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
    let w;
    try{const res=await fetch(`/api/weather?mode=${mode}`,{signal:controller.signal});if(!res.ok)throw new Error('server');w=await res.json();}
    catch{const sample=JSON.parse(await getText('11_날씨응답_예제.json'));w={...sample,reason:'server-unavailable',message:'날씨 서버 응답을 받지 못해 예제 자료를 표시합니다.',requestedAt:new Date().toISOString()};}
    displayWeather(w);$('#weather-request-state').textContent=mode==='live'&&w.mode!=='live'?'실제 연결 실패 → 예제 대체 표시':w.mode==='live'?'실제 연결 응답 확인':'예제 모드';
  }catch{latestWeather=null;renderRainAlerts();$('#weather-result').textContent='날씨 서버와 예제 자료를 모두 읽지 못했습니다. 다시 시도하세요.';$('#weather-request-state').textContent='자료 확인 필요';}
  finally{clearTimeout(timer);button.disabled=false;$('#weather-result').setAttribute('aria-busy','false');}
}
export async function initOperations(){
  $('#tasks').className='operations-section';
  $('#tasks').innerHTML=`
    <div class="section-heading"><div><p class="eyebrow">02 / OPERATIONS</p><h2>행사 운영 보드</h2></div><button id="marketing-only" class="button primary" aria-pressed="false">마케팅 담당만 보기</button></div>
    <section class="panel operation-filters"><div class="filter-grid">
      <label>점검 기준일<input type="date" id="task-base" value="${BASE_DATE}" required></label>
      <label>담당 역할<select id="task-role"><option value="">전체 담당 역할</option></select></label>
      <label>업무영역<select id="task-area"><option value="">전체 업무영역</option></select></label>
      <label>기한 분류<select id="task-category"><option value="">전체 미완료</option>${CATEGORIES.map(c=>`<option>${c}</option>`).join('')}</select></label>
    </div><p>모든 열과 상세 창은 같은 기준일·담당 필터를 사용합니다. 확인 체크는 원본 상태·기한 분류를 바꾸지 않습니다.</p></section>
    <p id="task-summary" role="status">준비표를 불러오는 중입니다.</p><p class="memo-notice" id="operations-storage">확인 체크·메모는 task_id별로 이 브라우저에만 저장됩니다. 팀 공유 기능은 없습니다.</p>
    <nav id="board-overview" class="board-overview" aria-label="기한 분류 열로 이동"></nav><p class="board-scroll-hint">5개 분류를 한 보드에 모았습니다. 분류를 누르거나 보드를 좌우로 움직여 확인하세요.</p><div id="task-list" class="task-board" aria-label="준비 항목 카드 보드" tabindex="0"></div>
    <section id="operations-rain" class="panel rain-panel" aria-label="운영 우천 준비 연결"></section>
    <details class="panel event-brief"><summary>행사 브리프 · 확정 조건</summary><dl id="event-facts"></dl><small>출처: B_팝업오픈/07_팝업브리프.md · 가상 행사</small></details>
    <p class="source-note">출처: C_행사준비/08_행사준비.csv · 원본 점검기준일 ${BASE_DATE} · 기준일 변경은 화면 분류에만 적용합니다.</p>`;
  const dialog=document.createElement('dialog');dialog.id='task-detail';dialog.className='task-detail';dialog.setAttribute('aria-labelledby','task-detail-title');
  dialog.innerHTML='<button id="task-detail-close" class="detail-close" aria-label="준비 항목 상세 닫기">닫기 ×</button><div id="task-detail-content"></div>';
  document.body.append(dialog);$('#task-detail-close').addEventListener('click',()=>dialog.close());dialog.addEventListener('close',renderTasks);
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
  $('#marketing-only').addEventListener('click',()=>{$('#task-role').value='마케팅 담당';$('#task-area').value='';$('#task-category').value='';renderTasks();});
  $('#task-base').addEventListener('change',()=>{if(!$('#task-base').value||!$('#task-base').validity.valid)$('#task-base').value=BASE_DATE;renderTasks();});
  $('#weather').className='weather-section';
  $('#weather').innerHTML=`<div class="section-heading"><div><p class="eyebrow">03 / WEATHER</p><h2>현재 · 5일 날씨</h2></div></div><section class="panel"><div class="weather-controls"><label>날씨 모드 <select id="weather-mode"><option value="sample">예제</option><option value="live">실시간 연결</option></select></label><button class="button primary" id="weather-refresh">날씨 조회</button><span id="weather-request-state" role="status"></span></div><div id="weather-result" aria-live="polite"></div></section><section id="weather-rain" class="panel rain-panel" aria-label="날씨 우천 준비 연결"></section>`;
  $('#weather-mode').addEventListener('change',refreshWeather);$('#weather-refresh').addEventListener('click',refreshWeather);
  for(const id of ['task-role','task-area','task-category'])$(`#${id}`).addEventListener('change',renderTasks);
  const results=await Promise.allSettled([getText('07_팝업브리프.md'),getText('08_행사준비.csv')]);
  if(results[0].status==='fulfilled'){period=eventPeriod(results[0].value);$('#event-facts').innerHTML=briefFacts(results[0].value).map(([k,v])=>`<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('');}else $('#event-facts').textContent='행사 브리프를 읽지 못했습니다.';
  try{if(results[1].status==='rejected')throw results[1].reason;tasks=parseTasks(results[1].value);for(const [id,field]of [['task-role','담당역할'],['task-area','업무영역']])$(`#${id}`).insertAdjacentHTML('beforeend',[...new Set(tasks.filter(t=>classify(t)!==null).map(t=>t[field]))].sort().map(v=>`<option>${esc(v)}</option>`).join(''));renderTasks();}catch(error){$('#task-summary').textContent=error.message;}
  await refreshWeather();
}
