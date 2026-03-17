// ── Vocabulary ──────────────────────────────────────────────────────────────
const VOCAB = {
  Cloud:['aws','ec2','vpc','s3','rds','iam','route53','alb','nlb','cloudwatch','ecr','autoscaling','eks','lambda','cloudformation','ssm','kms','elasticache','sns','sqs','ecs','fargate'],
  Containers:['docker','kubernetes','eks','helm','nginx','ingress','hpa','docker swarm','compose','containerd','podman','k8s'],
  'CI/CD':['jenkins','gitlab','github actions','maven','gradle','ansible','terraform','ci/cd','pipeline','sonarqube','sast','dast','argocd','gitops','spinnaker','circleci','tekton'],
  Monitoring:['prometheus','grafana','alertmanager','loki','promtail','dynatrace','appdynamics','opentelemetry','datadog','newrelic','cloudwatch','splunk','jaeger'],
  Security:['rbac','trivy','vault','secrets manager','jwt','kms','ssm','cis','hardening','sast','dast','sonarqube','snyk','iam','tls','waf'],
  Programming:['python','bash','go','golang','java','javascript','typescript','fastapi','shell','groovy','ruby','rust','node']
};
const CAT_COLORS = {Cloud:'#1D9E75',Containers:'#185FA5','CI/CD':'#BA7517',Monitoring:'#534AB7',Security:'#D85A30',Programming:'#3B6D11'};

// ── Resume data ─────────────────────────────────────────────────────────────
const RD = {
  name:'PRAKASH PAWAR',
  title:'Senior DevOps Engineer | AWS | Kubernetes (EKS) | Terraform | Jenkins/GitLab CI/CD | Prometheus/Grafana',
  contact:'Pune, MH  |  +91-9503572940  |  prakash.n.pawar1610@gmail.com  |  linkedin.com/in/prakash-pawar',
  summary:'Senior DevOps Engineer (4+ years) specializing in AWS (EC2, VPC, RDS, IAM, ALB/NLB, ECR), Kubernetes (EKS, Helm), and IaC (Terraform/Ansible). Built GitLab/Jenkins pipelines enabling multi-daily releases, cut deploy time 45 to 18 min, achieved 99.9% uptime, and reduced MTTR by ~35% via Prometheus/Grafana/Dynatrace.',
  skills:[
    {l:'Cloud (AWS)',v:'EC2, VPC, S3, RDS, IAM, ALB/NLB, Route53, CloudWatch, ECR, Secrets Manager, Auto Scaling'},
    {l:'CI/CD & IaC',v:'Jenkins, GitLab CI/CD, GitHub Actions, Terraform, Ansible, Maven, Gradle, Bash/Shell Scripting'},
    {l:'Containers & Orchestration',v:'Docker, Docker Swarm, Kubernetes (EKS), Helm, NGINX, Docker Compose'},
    {l:'Monitoring & Observability',v:'Prometheus, Grafana, Loki, Promtail, Alertmanager, Dynatrace APM, AppDynamics, CloudWatch'},
    {l:'Languages & DB',v:'Python, Bash, FastAPI, PostgreSQL, Aurora DB, DynamoDB, MySQL, DB2'},
    {l:'Security & Tools',v:'Trivy, RBAC, JWT, AWS Secrets Manager, HashiCorp Vault, Git, GitHub, GitLab'}
  ],
  experience:[
    {company:'Tietoevry Tech Services India Pvt. Ltd., Pune',role:'Senior DevOps Engineer',period:'Mar 2023 - Present',
     bullets:['Built end-to-end CI/CD with Jenkins & Docker for 10+ services; reduced deploy time 45 to 18 min; enabled zero-touch releases.','Architected AWS (EC2, RDS, S3, ALB/NLB, VPC, Route53) with 99.9% uptime; added auto-scaling for traffic spikes.','Led 5-engineer cross-functional squad; authored runbooks, branching strategy; mentored juniors.','Drove observability migration to Dynatrace; enabled tracing/anomaly detection; reduced MTTR ~35%.','Implemented Terraform with remote state (S3 + DynamoDB lock); cut env setup from days to under 30 min.','Enforced security with Trivy scans, IAM least-privilege, periodic access reviews.']},
    {company:'Tietoevry India Pvt. Ltd., Pune',role:'Junior DevOps Engineer',period:'Dec 2021 - Mar 2023',
     bullets:['Migrated from SVN to Git/GitLab; standardized MR workflows and reviews; improved release traceability.','Administered IBM WAS and coordinated multi-region AWS deployments with full rollback capability.','Managed Maven/Gradle builds and artifact versioning; maintained Aurora, DynamoDB, DB2 with automated backups.','On-call rotations; authored post-mortems; reduced repeat incidents by 25% in 6 months.']}
  ],
  projects:[
    {n:'Enterprise Community Services Platform',t:'Docker Swarm, AWS, Terraform, GitLab CI/CD, Prometheus/Grafana'},
    {n:'AI-Ops Analytics Platform',t:'FastAPI, Docker, Terraform, GitLab CI/CD, Prometheus/Grafana/Alertmanager'},
    {n:'High-Availability AWS Platform',t:'EC2 ASG, ALB/NLB, S3, Dynatrace APM'}
  ],
  education:'B.Tech, Electronics & Telecommunication -- Dr. BATU, Lonere (2017-2021)  |  GPA 7.77/10',
  certs:['GitHub Ultimate: Master Git and GitHub -- Udemy','DevOps & CI/CD Certification -- hands-on pipeline automation & cloud deployment',"Pat on the Back Award -- Tietoevry (production ownership)"]
};

const DEFAULT_RESUME = [
  RD.name, RD.title, RD.contact, '',
  'PROFESSIONAL SUMMARY', RD.summary, '',
  'TECHNICAL SKILLS', ...RD.skills.map(s=>s.l+': '+s.v), '',
  'PROFESSIONAL EXPERIENCE',
  ...RD.experience.map(e=>e.company+' -- '+e.role+' ('+e.period+')\n'+e.bullets.map(b=>'* '+b).join('\n')),
  '','KEY PROJECTS',...RD.projects.map(p=>'* '+p.n+' -- '+p.t),'',
  'EDUCATION',RD.education,'','CERTIFICATIONS & AWARDS',...RD.certs.map(c=>'* '+c)
].join('\n');

let lastReport=null, lastSummary='';
document.getElementById('cv').value = DEFAULT_RESUME;

// ── Scoring ─────────────────────────────────────────────────────────────────
function norm(t){return t.toLowerCase().replace(/[^a-z0-9+#./\-\s]/g,' ');}

function scoreKeywords(jd,cv){
  const jn=norm(jd),cn=norm(cv),cats={};
  let total=0,matched=0;
  for(const [cat,vocab] of Object.entries(VOCAB)){
    const inJD=vocab.filter(w=>jn.includes(w));
    const pool=inJD.length?inJD:vocab;
    const hit=pool.filter(w=>cn.includes(w));
    const miss=pool.filter(w=>!cn.includes(w)&&jn.includes(w));
    total+=pool.length; matched+=hit.length;
    cats[cat]={matched:[...new Set(hit)],missing:[...new Set(miss)]};
  }
  return{score:total?(matched/total)*100:0,cats};
}

function scoreStructure(cv){
  const checks={
    'Contact info':!!cv.match(/@|linkedin\.com|\+\d{6,}/i),
    'Clear headings':['professional summary','technical skills','experience','education'].some(s=>cv.toLowerCase().includes(s)),
    'Bullet points':(cv.match(/[*\u2022\-]/g)||[]).length>5,
    'Quantified metrics':!!cv.match(/\d+%|\d+\s*min|mttr|sla|\d+x/i),
    'Employment dates':!!cv.match(/20\d{2}/),
    'No tables/graphics':!cv.match(/<table|<img/i)
  };
  return{score:Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100,checks};
}

function buildSummary(jd){
  const jn=norm(jd),allV=Object.values(VOCAB).flat();
  const freq=allV.map(w=>({w,c:(jn.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const top=freq.slice(0,5).map(x=>x.w.toUpperCase());
  return 'Senior DevOps Engineer with 4+ years delivering '+(top[0]||'AWS')+' & '+(top[1]||'Kubernetes')+' solutions at scale. Proven track record in '+(top[2]||'Terraform')+', '+(top[3]||'CI/CD')+', and '+(top[4]||'Monitoring')+' with measurable impact: deploy times cut 45 to 18 min, 99.9% uptime, ~35% MTTR reduction. Bringing production-grade automation and observability expertise to your team.';
}

function suggestBullets(jd){
  const t=norm(jd),add=[];
  if(t.includes('lambda')) add.push('Integrated event-driven workflows using AWS Lambda for build/test notifications and drift checks.');
  if(t.includes('cloudformation')) add.push('Authored reusable CloudFormation/Terraform modules with parameterised environments and policy-as-code gates.');
  if(t.includes('argocd')||t.includes('gitops')) add.push('Adopted GitOps with Argo CD and Helm for declarative cluster state management with automated sync/rollback.');
  if(t.includes('sast')||t.includes('dast')||t.includes('sonarqube')) add.push('Embedded SAST/DAST and container image scanning (Trivy/SonarQube) as mandatory quality gates in CI/CD pipelines.');
  if(t.includes('cost')||t.includes('finops')) add.push('Optimised cloud spend via right-sizing, autoscaling, and S3 lifecycle rules, reducing monthly bill by ~18%.');
  if(t.includes('datadog')) add.push('Deployed Datadog APM with custom dashboards and anomaly-based alerting for P1 incident auto-escalation.');
  return add;
}

// ── Analyze ──────────────────────────────────────────────────────────────────
function analyze(){
  const jd=document.getElementById('jd').value.trim();
  const cv=document.getElementById('cv').value.trim();
  if(!jd){setMsg('Paste a job description first.');return;}
  if(!cv){setMsg('Resume is empty.');return;}
  const{score:ks,cats}=scoreKeywords(jd,cv);
  const{score:ss,checks}=scoreStructure(cv);
  const ats=Math.round(0.65*ks+0.35*ss);
  const summary=buildSummary(jd);
  const bullets=suggestBullets(jd);
  lastSummary=summary;
  lastReport={ats_score:ats,keyword_score:Math.round(ks),structure_score:Math.round(ss),categories:cats,structure_checks:checks,tailored_summary:summary,suggested_bullets:bullets,generated_at:new Date().toISOString()};
  renderResults(ats,ks,ss,cats,checks,summary,bullets);
  setMsg('');
}

// ── Render ───────────────────────────────────────────────────────────────────
function renderResults(ats,ks,ss,cats,checks,summary,bullets){
  const sEl=document.getElementById('s-num');
  sEl.textContent=ats+'%';
  sEl.style.color=ats>=75?'var(--accent)':ats>=55?'var(--warn)':'var(--danger)';
  const bEl=document.getElementById('s-badge');
  if(ats>=75){bEl.innerHTML='<span class="badge badge-good">Strong match</span>';updateTopBadge('Strong match','good');}
  else if(ats>=55){bEl.innerHTML='<span class="badge badge-mid">Moderate match</span>';updateTopBadge('Moderate match','mid');}
  else{bEl.innerHTML='<span class="badge badge-low">Needs improvement</span>';updateTopBadge('Needs improvement','low');}
  document.getElementById('bar-kw').style.width=Math.round(ks)+'%';
  document.getElementById('bar-str').style.width=Math.round(ss)+'%';
  document.getElementById('v-kw').textContent=Math.round(ks)+'%';
  document.getElementById('v-str').textContent=Math.round(ss)+'%';
  const cg=document.getElementById('cat-grid');cg.innerHTML='';
  for(const[cat,data]of Object.entries(cats)){
    const tot=(data.matched.length+data.missing.length)||1;
    const pct=Math.round(data.matched.length/tot*100);
    const col=CAT_COLORS[cat]||'var(--accent)';
    cg.innerHTML+='<div class="cat-card"><div class="cat-name">'+cat+'</div><div class="cat-pct" style="color:'+col+'">'+pct+'%</div><div class="bar-bg"><div class="bar-fill" style="width:'+pct+'%;background:'+col+'"></div></div></div>';
  }
  const cl=document.getElementById('chk-list');cl.innerHTML='';
  for(const[k,v]of Object.entries(checks)){
    cl.innerHTML+='<div class="chk"><span class="ci" style="color:'+(v?'var(--accent)':'var(--danger)')+'">'+( v?'&#10003;':'&#10007;')+'</span><span>'+k+'</span></div>';
  }
  const kd=document.getElementById('kw-detail');kd.innerHTML='';
  for(const[cat,data]of Object.entries(cats)){
    let h='<div class="kw-row"><div class="kw-cat-name">'+cat+'</div><div class="tags">';
    data.matched.forEach(t=>{h+='<span class="tag tg">'+t+'</span>';});
    data.missing.forEach(t=>{h+='<span class="tag tr">'+t+'</span>';});
    if(!data.matched.length&&!data.missing.length)h+='<span style="font-size:11px;color:var(--text3)">No terms in JD</span>';
    kd.innerHTML+=h+'</div></div>';
  }
  document.getElementById('summary-box').textContent=summary;
  if(bullets.length){
    const bl=document.getElementById('bullets-list');bl.innerHTML='';
    bullets.forEach(b=>{bl.innerHTML+='<div class="bullet">&#8226; '+b+'</div>';});
    document.getElementById('bullets-card').style.display='block';
  }else{document.getElementById('bullets-card').style.display='none';}
  document.getElementById('results').classList.add('show');
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
}

function updateTopBadge(text,level){
  const el=document.getElementById('top-badge');el.textContent=text;
  if(level==='good')el.style.cssText='background:var(--accent-light);color:var(--accent-dark);border:0.5px solid var(--accent-border)';
  else if(level==='mid')el.style.cssText='background:var(--warn-light);color:var(--warn);border:0.5px solid var(--warn-border)';
  else el.style.cssText='background:var(--danger-light);color:var(--danger);border:0.5px solid var(--danger-border)';
}

// ── PDF ───────────────────────────────────────────────────────────────────────
function pdfFilename(jd){
  const role=(jd.split('\n')[0]||'').trim().replace(/[^a-zA-Z0-9\s]/g,'').trim().slice(0,40).replace(/\s+/g,'_')||'DevOps_Engineer';
  const d=new Date(),dd=String(d.getDate()).padStart(2,'0'),mm=String(d.getMonth()+1).padStart(2,'0'),yy=d.getFullYear();
  return 'Prakash_Pawar_'+role+'_'+dd+mm+yy+'.pdf';
}

function downloadPDF(){
  if(!lastSummary){alert('Please click "Score ATS match" first to generate your tailored summary.');return;}
  if(typeof MiniPDF==='undefined'){setMsg('PDF engine not loaded. Please refresh the page.');return;}
  try{
    setMsg('Building PDF...');
    const jd=document.getElementById('jd').value.trim();
    buildResumePDF(jd);
    setMsg('');
  }catch(e){
    setMsg('PDF error: '+e.message);
    console.error('PDF error',e);
  }
}

function buildResumePDF(jd){
  const doc=new MiniPDF();
  const PW=MiniPDF.A4W, PH=MiniPDF.A4H;
  const ML=48, MR=48, MT=46, CW=PW-ML-MR;
  let y=MT;
  const TEAL=[13,110,86], DARK=[26,26,24], MID=[80,80,76], LITE=[140,140,136];

  function pageCheck(need){
    if(y+need>PH-44){doc.addPage();y=MT;doc.setLineWidth(0.8);}
  }

  function wrapText(text,x,startY,maxW,lineH,style,sz){
    if(style)doc.setFont(style);
    if(sz)doc.setFontSize(sz);
    const lines=doc.splitTextToSize(String(text),maxW);
    lines.forEach((ln,i)=>doc.text(ln,x,startY+i*lineH));
    return startY+lines.length*lineH;
  }

  function secHead(title){
    pageCheck(32);
    y+=14;
    doc.setFont('bold');doc.setFontSize(8);
    doc.setColor(...TEAL);
    doc.text(title.toUpperCase(),ML,y);
    y+=5;
    doc.setLineColor(...TEAL);doc.setLineWidth(0.9);
    doc.hline(ML,y,ML+CW);
    y+=11;
    doc.setColor(...DARK);
  }

  // ── Header block ───────────────────────────────────────────────────────
  doc.fillRect(ML-12,y-12,CW+24,80,224,242,234);

  doc.setFont('bold');doc.setFontSize(20);
  doc.setColor(...TEAL);
  doc.text(RD.name,ML,y+13);

  doc.setFont('normal');doc.setFontSize(9);
  doc.setColor(...MID);
  const titleLines=doc.splitTextToSize(RD.title,CW);
  titleLines.forEach((ln,i)=>doc.text(ln,ML,y+28+i*12));
  y=y+28+titleLines.length*12;

  doc.setFontSize(8.5);doc.setColor(...LITE);
  const cLines=doc.splitTextToSize(RD.contact,CW);
  cLines.forEach((ln,i)=>doc.text(ln,ML,y+5+i*11));
  y=y+5+cLines.length*11+18;

  // ── Summary ─────────────────────────────────────────────────────────────
  secHead('Professional Summary');
  doc.setFont('normal');doc.setFontSize(9.5);doc.setColor(...DARK);
  y=wrapText(lastSummary,ML,y,CW,14);
  y+=5;

  // ── Skills ──────────────────────────────────────────────────────────────
  secHead('Technical Skills');
  for(const sk of RD.skills){
    pageCheck(14);
    doc.setFontSize(9);doc.setFont('bold');doc.setColor(...DARK);
    const lbl=sk.l+': ';
    const lblW=doc.getTextWidth(lbl);
    doc.text(lbl,ML,y);
    doc.setFont('normal');doc.setColor(...MID);
    const vl=doc.splitTextToSize(sk.v,CW-lblW);
    vl.forEach((ln,i)=>doc.text(ln,ML+lblW,y+i*13));
    y+=vl.length*13;
  }
  y+=3;

  // ── Experience ──────────────────────────────────────────────────────────
  secHead('Professional Experience');
  for(const exp of RD.experience){
    pageCheck(56);
    doc.setFontSize(10);doc.setFont('bold');doc.setColor(...DARK);
    doc.text(exp.company,ML,y);
    doc.setFontSize(8.5);doc.setFont('normal');doc.setColor(...LITE);
    const pw=doc.getTextWidth(exp.period);
    doc.text(exp.period,ML+CW-pw,y);
    y+=13;
    doc.setFontSize(9.5);doc.setFont('bolditalic');doc.setColor(...TEAL);
    doc.text(exp.role,ML,y);
    y+=13;
    doc.setFont('normal');doc.setFontSize(9);doc.setColor(...DARK);
    for(const b of exp.bullets){
      pageCheck(14);
      const bl=doc.splitTextToSize(b,CW-16);
      doc.text('\u2022',ML+2,y);
      bl.forEach((ln,i)=>doc.text(ln,ML+16,y+i*13));
      y+=bl.length*13;
    }
    y+=7;
  }

  // ── Projects ────────────────────────────────────────────────────────────
  secHead('Key Projects');
  for(const p of RD.projects){
    pageCheck(14);
    doc.setFontSize(9);doc.setFont('bold');doc.setColor(...DARK);
    const prefix='\u2022  '+p.n+'  \u2014  ';
    const pW=doc.getTextWidth(prefix);
    doc.text(prefix,ML,y);
    doc.setFont('normal');doc.setColor(...MID);
    const tl=doc.splitTextToSize(p.t,CW-pW);
    tl.forEach((ln,i)=>doc.text(ln,ML+pW,y+i*13));
    y+=tl.length*13;
  }
  y+=3;

  // ── Education ───────────────────────────────────────────────────────────
  secHead('Education');
  doc.setFont('normal');doc.setFontSize(9.5);doc.setColor(...DARK);
  y=wrapText(RD.education,ML,y,CW,13);
  y+=4;

  // ── Certs ───────────────────────────────────────────────────────────────
  secHead('Certifications & Awards');
  for(const c of RD.certs){
    pageCheck(14);
    doc.setFontSize(9);doc.setFont('normal');doc.setColor(...DARK);
    const cl=doc.splitTextToSize(c,CW-16);
    doc.text('\u2022',ML+2,y);
    cl.forEach((ln,i)=>doc.text(ln,ML+16,y+i*13));
    y+=cl.length*13;
  }

  // ── Footer on every page ────────────────────────────────────────────────
  const total=doc.pages.length;
  for(let i=0;i<total;i++){
    doc.curPage=doc.pages[i];
    doc.setFontSize(7.5);doc.setFont('normal');doc.setColor(190,190,186);
    doc.text('Prakash Pawar  |  prakash.n.pawar1610@gmail.com',ML,PH-18);
    const pg='Page '+(i+1)+' of '+total;
    doc.curPage=doc.pages[i];
    doc.setFontSize(7.5);
    doc.text(pg,PW-MR-doc.getTextWidth(pg),PH-18);
  }

  doc.save(pdfFilename(jd));
}

// ── Claude prompts ────────────────────────────────────────────────────────────
function askClaudeSummary(){
  const jd=document.getElementById('jd').value.trim();
  if(!jd||!lastReport){alert('Run analysis first.');return;}
  const matched=Object.entries(lastReport.categories).map(([c,d])=>c+': '+(d.matched.join(', ')||'none')).join(' | ');
  const msg='Please rewrite my Professional Summary for this job.\n\nMatched keywords: '+matched+'\n\nJD (first 700 chars):\n'+jd.slice(0,700)+'\n\nCurrent summary:\n'+lastSummary+'\n\nWrite a 2-3 sentence ATS-optimised summary mirroring JD language. Keep it factual.';
  if(window.sendPrompt)window.sendPrompt(msg);
  else{navigator.clipboard.writeText(msg);alert('Prompt copied!');}
}

function askClaudeBullets(){
  const jd=document.getElementById('jd').value.trim();
  if(!jd||!lastReport){alert('Run analysis first.');return;}
  const missing=Object.entries(lastReport.categories).flatMap(([,d])=>d.missing).join(', ')||'none';
  const msg='Tailor my DevOps resume. Missing JD keywords: '+missing+'\n\nJD (first 700 chars):\n'+jd.slice(0,700)+'\n\nSuggest 3-5 specific bullet points I could add (only for tech I actually used). Include metrics. Format as ready-to-paste resume bullets.';
  if(window.sendPrompt)window.sendPrompt(msg);
  else{navigator.clipboard.writeText(msg);alert('Prompt copied!');}
}

function copySummary(){
  navigator.clipboard.writeText(lastSummary).then(()=>{setMsg('Copied!');setTimeout(()=>setMsg(''),1800);});
}

function dlJSON(){
  if(!lastReport)return;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));
  a.download='ats_report.json';a.click();
}

function resetAll(){
  document.getElementById('jd').value='';
  document.getElementById('cv').value=DEFAULT_RESUME;
  document.getElementById('results').classList.remove('show');
  const tb=document.getElementById('top-badge');
  tb.textContent='No score yet';tb.style.cssText='';
  lastReport=null;lastSummary='';setMsg('');
}

function setMsg(t){document.getElementById('msg').textContent=t;}
