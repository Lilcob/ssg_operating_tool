// Classic script: this entry point also runs when index.html is opened as a file.
(() => {
  const localURL = 'http://127.0.0.1:4173/';
  function showIssue(title, message) {
    let notice = document.querySelector('#startup-notice');
    if (!notice) {
      notice = document.createElement('section');
      notice.id = 'startup-notice';
      notice.className = 'panel';
      notice.setAttribute('role', 'alert');
      notice.style.cssText = 'margin:24px 0;border-color:#d6a95d;background:#fff8e9';
      document.querySelector('.workspace').prepend(notice);
    }
    notice.replaceChildren();
    const heading = document.createElement('h2'); heading.textContent = title;
    const description = document.createElement('p'); description.textContent = message;
    const link = document.createElement('a'); link.href = localURL; link.className = 'button primary'; link.textContent = '로컬 서버에서 앱 열기';
    const guidance = document.createElement('p'); guidance.textContent = '서버가 꺼져 있으면 운영대시보드 폴더에서 npm start를 실행하세요.';
    notice.append(heading, description, link, guidance);
    document.querySelector('#data-status').textContent = title;
    document.querySelector('#records-caption').textContent = message;
    const cell = document.querySelector('#sales-table-body td');
    if (cell) cell.textContent = message;
  }
  if (location.protocol === 'file:') {
    showIssue('로컬 서버로 열어주세요', 'HTML 파일을 직접 열면 데이터와 날씨 API를 불러올 수 없습니다. 아래 버튼으로 실행 중인 앱을 여세요.');
    document.querySelectorAll('button,input,select').forEach(control => { control.disabled = true; });
    return;
  }
  const script = document.createElement('script');
  script.src = new URL('./app.js', document.baseURI).href;
  script.onerror = () => showIssue('앱 실행 파일을 불러오지 못했습니다', 'npm run build 후 서버 주소를 다시 열어주세요.');
  window.addEventListener('error', event => {
    if (event.filename && event.filename.split('?')[0] === script.src) {
      showIssue('앱 초기화에 실패했습니다', '소스 HTML 대신 서버 주소로 접속하세요. 문제가 계속되면 앱을 다시 빌드한 뒤 새로고침하세요.');
    }
  });
  document.body.append(script);
})();
