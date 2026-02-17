const App = (() => {
  const DEFAULT_DATA = {
    profile: {
      name: "Eric Margay",
      bio: "Ingeniero creativo — LEDs, audiovisual y software.",
      avatar: "",
      accent: "#7c6cff",
      badges: ["⚡ Maker", "🎧 Audio-reactivo", "💡 LED Art"]
    },
    links: [
      { icon: "github", title: "GitHub", url: "https://github.com/", visible: true },
      { icon: "x", title: "X (Twitter)", url: "https://x.com/", visible: true },
      { icon: "instagram", title: "Instagram", url: "https://instagram.com/", visible: true },
      { icon: "discord", title: "Discord", url: "https://discord.gg/", visible: true }
    ]
  };

  const KEY = "linktree-data-v1";
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function setTheme(accent){
    document.documentElement.style.setProperty('--accent', accent || '#7c6cff');
  }

  function setMode(mode){
    if(mode === 'light'){ document.documentElement.classList.add('light'); }
    else{ document.documentElement.classList.remove('light'); }
    localStorage.setItem('linktree-theme', mode);
  }

  function toggleTheme(){
    const mode = document.documentElement.classList.contains('light') ? 'dark' : 'light';
    setMode(mode);
  }

  function initTheme(){
    const saved = localStorage.getItem('linktree-theme') || 'dark';
    setMode(saved);
    const t = document.getElementById('themeToggle');
    if(t) t.addEventListener('click', toggleTheme);
  }

  async function loadData(){
    try{
      const res = await fetch('data.json', { cache: 'no-store' });
      if(res.ok){
        const d = await res.json();
        localStorage.setItem(KEY, JSON.stringify(d));
        return d;
      }
    }catch(e){}
    const local = localStorage.getItem(KEY);
    if(local) return JSON.parse(local);
    return DEFAULT_DATA;
  }

  function saveLocal(data){
    localStorage.setItem(KEY, JSON.stringify(data));
  }

  function iconSvg(id){
    if(!id) return null;
    const known = [
      "website","email","github","x","linkedin","instagram","facebook","youtube","tiktok",
      "discord","telegram","whatsapp","spotify","soundcloud","twitch","bandcamp",
      "medium","substack","paypal","patreon","kofi","amazon","shopify"
    ];
    if(!known.includes(id)) return null;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox","0 0 24 24");
    const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
    use.setAttributeNS("http://www.w3.org/1999/xlink", "href", `icons/icons.svg#${id}`);
    svg.appendChild(use);
    return svg;
  }

  function renderPublic(data){
    setTheme(data.profile.accent);

    $('#name').textContent = data.profile.name || 'Sin nombre';
    $('#bio').textContent = data.profile.bio || '';
    const avatar = $('#avatar');
    const fallback = $('#avatar-fallback');
    if(data.profile.avatar){
      avatar.src = data.profile.avatar;
      avatar.style.display = 'block';
      fallback.style.display = 'none';
    } else {
      avatar.style.display = 'none';
      const initials = (data.profile.name || 'User').split(/\\s+/).map(w => w[0]?.toUpperCase()).slice(0,2).join('');
      fallback.textContent = initials || 'U';
      fallback.style.display = 'grid';
    }

    const badgesWrap = $('#badges');
    badgesWrap.innerHTML = '';
    (data.profile.badges || []).forEach(b => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.textContent = b;
      badgesWrap.appendChild(chip);
    });

    const linksWrap = $('#links');
    linksWrap.innerHTML = '';
    (data.links || []).filter(l => l.visible !== false).forEach(link => {
      const a = document.createElement('a');
      a.className = 'link-card';
      a.href = link.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.innerHTML = `
        <div class="left">
          <div class="icon"></div>
          <div class="meta">
            <h3 class="title">${escapeHtml(link.title || 'Enlace')}</h3>
            <p class="url">${escapeHtml(link.url || '')}</p>
          </div>
        </div>
      `;
      const iconBox = a.querySelector('.icon');
      const svg = iconSvg(link.icon);
      if(svg){ iconBox.innerHTML=''; iconBox.appendChild(svg); }
      else{ iconBox.textContent = link.icon || '🔗'; }
      linksWrap.appendChild(a);
    });
  }

  function escapeHtml(str){
    return (str || '').replace(/[&<>"']/g, s => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[s]));
  }

  function bindAdminTable(data){
    const body = $('#linksBody');
    body.innerHTML = '';
    data.links.forEach((lnk, idx) => {
      const tr = document.createElement('tr');

      tr.innerHTML = `
        <td>${idx+1}</td>
        <td><input class="icon-input" list="iconlist" value="${lnk.icon || ''}" /></td>
        <td><input class="title-input" value="${escapeHtml(lnk.title || '')}" /></td>
        <td><input class="url-input" value="${escapeHtml(lnk.url || '')}" /></td>
        <td><input type="checkbox" ${lnk.visible !== false ? 'checked' : ''} /></td>
        <td class="row-actions">
          <button class="btn ghost" data-act="up">↑</button>
          <button class="btn ghost" data-act="down">↓</button>
          <button class="btn" data-act="del">Eliminar</button>
        </td>
      `;

      const [iconEl, titleEl, urlEl, visEl] = tr.querySelectorAll('input');
      iconEl.addEventListener('input', e => lnk.icon = e.target.value);
      titleEl.addEventListener('input', e => lnk.title = e.target.value);
      urlEl.addEventListener('input', e => lnk.url = e.target.value);
      visEl.addEventListener('change', e => lnk.visible = e.target.checked);

      tr.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          const act = btn.dataset.act;
          const i = idx;
          if(act === 'up' && i > 0){
            [data.links[i-1], data.links[i]] = [data.links[i], data.links[i-1]];
            bindAdminTable(data);
          }else if(act === 'down' && i < data.links.length - 1){
            [data.links[i+1], data.links[i]] = [data.links[i], data.links[i+1]];
            bindAdminTable(data);
          }else if(act === 'del'){
            data.links.splice(i,1);
            bindAdminTable(data);
          }
        });
      });

      body.appendChild(tr);
    });
  }

  function getAdminProfileForm(data){
    $('#name').value = data.profile.name || '';
    $('#bio').value = data.profile.bio || '';
    $('#avatar').value = data.profile.avatar || '';
    $('#accent').value = data.profile.accent || '#7c6cff';
    $('#badges').value = (data.profile.badges || []).join(', ');
  }

  function setAdminProfileForm(data){
    data.profile.name = $('#name').value.trim();
    data.profile.bio = $('#bio').value.trim();
    data.profile.avatar = $('#avatar').value.trim();
    data.profile.accent = $('#accent').value;
    data.profile.badges = $('#badges').value.split(',').map(s => s.trim()).filter(Boolean);
  }

  function exportJson(data){
    const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.json';
    a.click();
    URL.revokeObjectURL(a.href);
  }

  function importJson(file){
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        try{
          const json = JSON.parse(reader.result);
          resolve(json);
        }catch(e){ reject(e); }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  function showAdminUI(show){
    $('#profileCard').classList.toggle('hidden', !show);
    $('#linksCard').classList.toggle('hidden', !show);
    $('#saveRow').classList.toggle('hidden', !show);
    $('#gate').classList.toggle('hidden', show);
  }

  function loginOk(){
    return sessionStorage.getItem('admin-ok') === '1';
  }

  return {
    async initPublic(){
      initTheme();
      const data = await loadData();
      setTheme(data.profile.accent);
      renderPublic(data);
    },
    async initAdmin(){
      initTheme();

      const PASS = "melo";
      const enterBtn = $('#enterBtn');
      const pwd = $('#pwd');
      const logoutBtn = $('#logoutBtn');

      function tryEnter(){
        if(pwd.value === PASS){
          sessionStorage.setItem('admin-ok','1');
          showAdminUI(true);
          bootAdmin();
        }else{
          alert('Contraseña incorrecta');
        }
      }

      if(loginOk()){
        showAdminUI(true);
        bootAdmin();
      }else{
        showAdminUI(false);
      }

      enterBtn.addEventListener('click', tryEnter);
      pwd.addEventListener('keydown', e => { if(e.key === 'Enter') tryEnter(); });
      logoutBtn?.addEventListener('click', () => {
        sessionStorage.removeItem('admin-ok');
        location.reload();
      });

      async function bootAdmin(){
        const data = await loadData();
        setTheme(data.profile.accent);

        getAdminProfileForm(data);
        bindAdminTable(data);

        $('#addLink').addEventListener('click', () => {
          data.links.push({ icon: "website", title: "Nuevo enlace", url: "https://", visible: true });
          bindAdminTable(data);
        });

        $('#saveBtn').addEventListener('click', () => {
          setAdminProfileForm(data);
          saveLocal(data);
          alert('Guardado localmente en este navegador.');
        });

        const picker = $('#filePicker');
        $('#importBtn').addEventListener('click', () => picker.click());
        picker.addEventListener('change', async (e) => {
          const file = e.target.files[0];
          if(!file) return;
          try{
            const json = await importJson(file);
            saveLocal(json);
            location.reload();
          }catch(err){
            alert('Archivo inválido: ' + err.message);
          }finally{
            e.target.value = '';
          }
        });

        $('#exportBtn').addEventListener('click', () => {
          setAdminProfileForm(data);
          exportJson(data);
        });
      }
    }
  };
})();
