// ── Vocabulary (9 categories) ────────────────────────────────────────────────
const VOCAB = {
  Cloud:       ['aws','ec2','vpc','s3','rds','iam','route53','alb','nlb','cloudwatch','ecr','autoscaling','eks','lambda','cloudformation','ssm','kms','elasticache','sns','sqs','ecs','fargate','waf'],
  Containers:  ['docker','kubernetes','eks','helm','nginx','ingress','hpa','docker swarm','compose','containerd','podman','k8s','argocd','gitops','flux'],
  'CI/CD':     ['jenkins','gitlab','github actions','maven','gradle','ansible','terraform','ci/cd','pipeline','sonarqube','argocd','gitops','spinnaker','circleci','tekton','atlantis'],
  Monitoring:  ['prometheus','grafana','alertmanager','loki','promtail','dynatrace','appdynamics','opentelemetry','datadog','newrelic','cloudwatch','splunk','jaeger','zipkin','thanos'],
  Security:    ['rbac','trivy','vault','secrets manager','jwt','kms','ssm','cis','hardening','sast','dast','sonarqube','snyk','iam','tls','waf','zero trust','devsecops','shift-left'],
  Programming: ['python','bash','go','golang','java','javascript','typescript','fastapi','shell','groovy','ruby','rust','node','powershell','yaml','hcl'],
  Database:    ['postgresql','mysql','mongodb','redis','elasticsearch','dynamodb','aurora','cassandra','kafka','db2','mariadb','snowflake','rds','opensearch'],
  'Agile/Process': ['agile','scrum','kanban','sprint','jira','confluence','roadmap','stakeholder','postmortem','runbook','sre','toil','okr','sla','slo','sli'],
  Compliance:  ['soc2','gdpr','iso27001','pci-dss','hipaa','cis benchmark','nist','fedramp','owasp','devsecops','shift-left','vulnerability']
};

const CAT_COLORS = {
  Cloud:'#1D9E75', Containers:'#185FA5', 'CI/CD':'#BA7517',
  Monitoring:'#534AB7', Security:'#D85A30', Programming:'#3B6D11',
  Database:'#0E7490', 'Agile/Process':'#7C3AED', Compliance:'#BE185D'
};

// ── Tech keyword → display-name lookup (for proper capitalization in PDF) ────
const TECH_CASE = {
  'aws':'AWS','ec2':'EC2','vpc':'VPC','s3':'S3','rds':'RDS','iam':'IAM',
  'route53':'Route53','alb':'ALB','nlb':'NLB','cloudwatch':'CloudWatch',
  'ecr':'ECR','autoscaling':'Auto Scaling','eks':'EKS','lambda':'Lambda',
  'cloudformation':'CloudFormation','ssm':'SSM','kms':'KMS',
  'elasticache':'ElastiCache','sns':'SNS','sqs':'SQS','ecs':'ECS',
  'fargate':'Fargate','waf':'WAF','docker':'Docker','kubernetes':'Kubernetes',
  'helm':'Helm','nginx':'NGINX','ingress':'Ingress','hpa':'HPA',
  'docker swarm':'Docker Swarm','compose':'Docker Compose',
  'containerd':'containerd','podman':'Podman','k8s':'K8s',
  'argocd':'ArgoCD','gitops':'GitOps','flux':'Flux',
  'jenkins':'Jenkins','gitlab':'GitLab','github actions':'GitHub Actions',
  'maven':'Maven','gradle':'Gradle','ansible':'Ansible','terraform':'Terraform',
  'ci/cd':'CI/CD','sonarqube':'SonarQube','spinnaker':'Spinnaker',
  'circleci':'CircleCI','tekton':'Tekton','atlantis':'Atlantis',
  'prometheus':'Prometheus','grafana':'Grafana','alertmanager':'Alertmanager',
  'loki':'Loki','promtail':'Promtail','dynatrace':'Dynatrace',
  'appdynamics':'AppDynamics','opentelemetry':'OpenTelemetry',
  'datadog':'Datadog','newrelic':'New Relic','splunk':'Splunk',
  'jaeger':'Jaeger','zipkin':'Zipkin','thanos':'Thanos','victoria':'VictoriaMetrics',
  'rbac':'RBAC','trivy':'Trivy','vault':'HashiCorp Vault',
  'secrets manager':'Secrets Manager','jwt':'JWT','tls':'TLS',
  'snyk':'Snyk','sast':'SAST','dast':'DAST','zero trust':'Zero Trust',
  'devsecops':'DevSecOps','shift-left':'Shift-Left',
  'python':'Python','bash':'Bash','go':'Go','golang':'Go','java':'Java',
  'javascript':'JavaScript','typescript':'TypeScript','fastapi':'FastAPI',
  'shell':'Shell Scripting','groovy':'Groovy','ruby':'Ruby','rust':'Rust',
  'node':'Node.js','powershell':'PowerShell','yaml':'YAML','hcl':'HCL',
  'postgresql':'PostgreSQL','mysql':'MySQL','mongodb':'MongoDB','redis':'Redis',
  'elasticsearch':'Elasticsearch','dynamodb':'DynamoDB','aurora':'Aurora DB',
  'cassandra':'Cassandra','kafka':'Apache Kafka','db2':'DB2',
  'mariadb':'MariaDB','snowflake':'Snowflake','opensearch':'OpenSearch',
  'agile':'Agile','scrum':'Scrum','kanban':'Kanban','sprint':'Sprint',
  'jira':'Jira','confluence':'Confluence','sre':'SRE','sla':'SLA',
  'slo':'SLO','sli':'SLI','okr':'OKRs','postmortem':'Post-Mortem','runbook':'Runbook',
  'soc2':'SOC2','gdpr':'GDPR','iso27001':'ISO27001','pci-dss':'PCI-DSS',
  'hipaa':'HIPAA','nist':'NIST','owasp':'OWASP','fedramp':'FedRAMP'
};
function techCase(w){ return TECH_CASE[w.toLowerCase()] || (w.charAt(0).toUpperCase()+w.slice(1)); }

// ── Build ATS-tailored resume: injects missing JD keywords into Skills + Stacks ──
function buildTailoredResume(){
  if(!lastReport) return RD;
  // Deep clone so we never mutate the source RD
  const T = JSON.parse(JSON.stringify(RD));

  // Category → skill row label (where the keyword naturally belongs)
  const CAT_SKILL = {
    'Cloud':          'Cloud (AWS)',
    'Containers':     'Containers & Orch.',
    'CI/CD':          'CI/CD & IaC',
    'Monitoring':     'Monitoring',
    'Security':       'Security & Tools',
    'Programming':    'Languages & DB',
    'Database':       'Languages & DB',
    'Compliance':     'Security & Tools',
    'Agile/Process':  null  // no single skills row; goes to project stacks
  };

  const placed = new Set();  // track placed keywords to avoid duplicates

  // ── Step 1: Inject into Technical Skills rows ──────────────────────────
  for(const [cat, data] of Object.entries(lastReport.categories)){
    if(!data.missing.length) continue;
    const rowLabel = CAT_SKILL[cat];
    if(!rowLabel) continue;
    const row = T.skills.find(s => s.l === rowLabel);
    if(!row) continue;
    const valLower = row.v.toLowerCase();
    const toAdd = data.missing.filter(w =>{
      if(placed.has(w)) return false;
      // Skip if this keyword (or its display name) is already in the row
      const display = techCase(w).toLowerCase();
      return !valLower.includes(w.toLowerCase()) && !valLower.includes(display);
    });
    if(toAdd.length){
      row.v += ', ' + toAdd.map(techCase).join(', ');
      toAdd.forEach(w => placed.add(w));
    }
  }

  // ── Step 2: Remaining keywords → most relevant Project stack line ──────
  for(const [cat, data] of Object.entries(lastReport.categories)){
    const unplaced = data.missing.filter(w => !placed.has(w));
    if(!unplaced.length) continue;
    // Find project whose stack + bullets best overlap with this category
    const catVocab = VOCAB[cat] || [];
    let bestProj = T.projects[0], bestScore = -1;
    for(const p of T.projects){
      const haystack = (p.stack+' '+p.bullets.join(' ')).toLowerCase();
      const score = catVocab.filter(w => haystack.includes(w)).length;
      if(score > bestScore){ bestScore = score; bestProj = p; }
    }
    const stackLower = bestProj.stack.toLowerCase();
    const toAdd = unplaced.filter(w => !stackLower.includes(w.toLowerCase()));
    if(toAdd.length){
      bestProj.stack += ', ' + toAdd.map(techCase).join(', ');
      toAdd.forEach(w => placed.add(w));
    }
  }

  return T;
}

// ── Resume data ─────────────────────────────────────────────────────────────
const RD = {
  name:    'PRAKASH PAWAR',
  title:   'Senior DevOps Engineer',
  contact: 'Pune, MH  |  +91-9503572940  |  prakash.n.pawar1610@gmail.com  |  linkedin.com/in/prakash-pawar',
  summary: 'Senior DevOps Engineer with 4+ years at Tietoevry, designing and automating high-availability infrastructure on AWS for enterprise-grade platforms serving internal and external users. Reduced deployment times from ~45 min to ~18 min across 10+ production services and cut manual operational effort by 30% through CI/CD automation and IaC. Deep hands-on expertise in Docker, Kubernetes (EKS), Terraform, and GitLab/GitHub pipelines. Proven ability to lead cross-functional teams, drive observability maturity, and own full DevOps delivery end-to-end.',
  skills: [
    { l: 'Cloud (AWS)',        v: 'EC2, RDS, S3, EBS, VPC, ALB/NLB, Route53, IAM, CloudWatch, ECR, Secrets Manager, Auto Scaling' },
    { l: 'CI/CD & IaC',       v: 'GitLab CI/CD, GitHub Actions, Jenkins, Terraform, Ansible, Maven, Gradle, Bash/Shell Scripting' },
    { l: 'Containers & Orch.', v: 'Docker, Docker Swarm, Kubernetes (EKS), Helm, NGINX, Docker Compose' },
    { l: 'Monitoring',         v: 'Prometheus, Grafana, Loki, Promtail, Alertmanager, Dynatrace APM, AppDynamics, CloudWatch' },
    { l: 'Languages & DB',     v: 'Python, Bash, FastAPI, PostgreSQL, Aurora DB, DynamoDB, MySQL, DB2' },
    { l: 'Security & Tools',   v: 'Trivy, RBAC, JWT, AWS Secrets Manager, HashiCorp Vault, Git, GitHub, GitLab' }
  ],
  experience: [
    {
      role:    'Senior DevOps Engineer',
      company: 'Tietoevry Tech Services India Pvt. Ltd., Pune',
      sub:     'Promoted from Junior DevOps Engineer',
      period:  'March 2023 \u2013 Present',
      bullets: [
        'Built and maintained end-to-end CI/CD pipelines using Jenkins and Docker across 10+ production services, cutting deployment time from ~45 min to ~18 min and enabling multiple daily releases with zero manual intervention.',
        'Architected AWS infrastructure (EC2, RDS, S3, ALB/NLB, VPC, Route53) maintaining 99.9% uptime SLA for mission-critical enterprise applications; implemented auto-scaling policies to handle traffic spikes without degradation.',
        'Led cross-functional team of 5 engineers to design deployment runbooks, enforce branching strategies, and resolve infrastructure bottlenecks \u2014 owning technical decisions and mentoring junior engineers.',
        'Drove observability maturity by migrating from CloudWatch to Dynatrace APM, enabling distributed tracing, anomaly detection, and reducing MTTR by ~35% across all production services.',
        'Implemented Terraform IaC with S3 remote state and DynamoDB locking, enabling fully reproducible environment provisioning across dev, staging, and production \u2014 reducing new environment setup from days to under 30 minutes.',
        'Enforced security posture via Docker image vulnerability scanning (Trivy), IAM least-privilege policies, and regular access reviews across all AWS accounts and CI/CD service accounts.'
      ]
    },
    {
      role:    'Junior DevOps Engineer',
      company: 'Tietoevry India Pvt. Ltd., Pune',
      sub:     '',
      period:  'Dec 2021 \u2013 March 2023',
      bullets: [
        'Led org-wide version control migration from SVN to Git/GitLab, establishing branching strategies, MR workflows, and code review standards \u2014 improving release traceability across all application teams.',
        'Administered IBM WebSphere Application Server (WAS) and coordinated multi-region AWS deployments, achieving zero-defect release cycles with full rollback capability.',
        'Managed Maven/Gradle build lifecycle and artifact versioning across multi-environment promotion workflows; maintained Aurora DB, DynamoDB, and DB2 with automated backup and integrity checks.',
        'Participated in on-call rotations; authored post-mortems and implemented preventive measures, reducing repeat incidents by 25% over 6 months.'
      ]
    }
  ],
  projects: [
    {
      name:  'Enterprise Community Services Platform \u2014 Full-Stack DevOps Delivery',
      stack: 'Stack: React.js, Node.js, PostgreSQL, Docker Swarm, AWS EC2/VPC/RDS, Terraform, GitLab CI/CD, Prometheus, Grafana, NGINX',
      bullets: [
        'Containerized React + NGINX frontend and Node.js backend using Docker multi-stage builds, reducing final image sizes by 60%; orchestrated on Docker Swarm with zero-downtime rolling updates serving production traffic.',
        'Provisioned all AWS infrastructure via Terraform IaC (VPC, EC2, RDS, Security Groups) with S3 remote state \u2014 enabling full environment rebuild from scratch in under 15 minutes.',
        'Designed GitLab CI/CD pipeline with automated build, test, Docker Hub push, and SSH-based Swarm deployment; implemented JWT auth, bcrypt hashing, RBAC, and AWS Secrets Manager for runtime secret injection.'
      ]
    },
    {
      name:  'AI-Powered Operations Analytics Platform \u2014 REST API & Observability',
      stack: 'Stack: Python, FastAPI, Docker, Terraform, AWS EC2, GitLab CI/CD, Prometheus, Grafana, Alertmanager',
      bullets: [
        'Engineered high-performance AI-Ops REST API using FastAPI + Poetry; containerized with Docker for full environment parity; provisioned modular EC2 infra via Terraform enabling isolated dev environments without AWS console access.',
        'Built GitLab CI/CD pipeline with automated Pytest execution, Docker image builds, Trivy vulnerability scanning, and EC2 deployment \u2014 with Alertmanager firing Slack alerts on error rate threshold breaches.'
      ]
    },
    {
      name:  'High-Availability AWS Infrastructure \u2014 Traffic & Storage Platform',
      stack: 'Stack: AWS EC2, S3, ALB/NLB, Auto Scaling Groups, CI/CD Pipelines, Dynatrace APM',
      bullets: [
        'Designed multi-AZ AWS architecture with EC2 Auto Scaling groups, ALB/NLB health-check-based failover, and S3 object storage \u2014 eliminating single points of failure and reducing infrastructure cost by optimizing instance right-sizing.',
        'Integrated Dynatrace APM for real-time performance monitoring, distributed tracing, and AI-powered anomaly detection across all production services.'
      ]
    }
  ],
  education: {
    degree: 'B.Tech \u2014 Electronics & Telecommunication Engineering',
    uni:    'Dr. Babasaheb Ambedkar Technological University,\nLonere  |  2017\u20132021  |  GPA: 7.77/10'
  },
  certs: [
    'GitHub Ultimate: Master Git and GitHub \u2014 Udemy',
    'DevOps & CI/CD Certification \u2014 Hands-on pipeline\nautomation & cloud deployment',
    "\u2018Pat on the Back\u2019 Award \u2014 Tietoevry, for excellence in\nhigh-stakes production ownership"
  ]
};

const DEFAULT_RESUME = [
  RD.name, RD.title, RD.contact, '',
  'PROFESSIONAL SUMMARY', RD.summary, '',
  'TECHNICAL SKILLS', ...RD.skills.map(s=>s.l+': '+s.v), '',
  'PROFESSIONAL EXPERIENCE',
  ...RD.experience.map(e=>e.company+' -- '+e.role+' ('+e.period+')\n'+e.bullets.map(b=>'* '+b).join('\n')),
  '','KEY PROJECTS',...RD.projects.map(p=>'* '+p.name+' -- '+p.stack),'',
  'EDUCATION',RD.education.degree+'\n'+RD.education.uni,'','CERTIFICATIONS & AWARDS',...RD.certs.map(c=>'* '+c)
].join('\n');

// ── State ─────────────────────────────────────────────────────────────────────
let lastReport = null, lastSummary = '';

// ── LocalStorage ──────────────────────────────────────────────────────────────
const LS_RESUME  = 'ats_resume_v3';   // bumped: v2 had pre-filled resume
const LS_HISTORY = 'ats_history_v2';
function saveResume(t){ try{localStorage.setItem(LS_RESUME,t);}catch(e){} }
function loadResume(){ try{return localStorage.getItem(LS_RESUME);}catch(e){return null;} }
function saveHistory(report, jdSnippet){
  try{
    const h = loadHistory();
    h.unshift({ timestamp:new Date().toISOString(), jd_snippet:jdSnippet.replace(/\s+/g,' ').trim().slice(0,90), ats_score:report.ats_score, keyword_score:report.keyword_score, structure_score:report.structure_score });
    localStorage.setItem(LS_HISTORY, JSON.stringify(h.slice(0,5)));
  }catch(e){}
}
function loadHistory(){ try{return JSON.parse(localStorage.getItem(LS_HISTORY))||[];}catch(e){return[];} }

// ── File upload ───────────────────────────────────────────────────────────────
function wireUpload(btnId, inputId, targetId, persist){
  const btn=document.getElementById(btnId), inp=document.getElementById(inputId);
  if(!btn||!inp) return;
  btn.onclick=()=>inp.click();
  inp.onchange=function(){
    const f=this.files[0]; if(!f) return;
    const r=new FileReader();
    r.onload=ev=>{ const txt=ev.target.result; document.getElementById(targetId).value=txt; updateCharCount(targetId); if(persist) saveResume(txt); this.value=''; };
    r.readAsText(f);
  };
}

// ── Char count ────────────────────────────────────────────────────────────────
function updateCharCount(id){
  const el=document.getElementById(id), cnt=document.getElementById(id+'-count');
  if(!el||!cnt) return;
  const words=el.value.trim()?el.value.trim().split(/\s+/).length:0;
  cnt.textContent=words.toLocaleString()+' words \xb7 '+el.value.length.toLocaleString()+' chars';
}

// ── Scoring ───────────────────────────────────────────────────────────────────
function norm(t){ return t.toLowerCase().replace(/[^a-z0-9+#./\-\s]/g,' '); }

function scoreKeywords(jd,cv){
  const jn=norm(jd),cn=norm(cv),cats={};
  let total=0,matched=0;
  for(const[cat,vocab] of Object.entries(VOCAB)){
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
    'Contact info':       !!cv.match(/@|linkedin\.com|\+\d{6,}/i),
    'Clear headings':     ['professional summary','technical skills','experience','education'].some(s=>cv.toLowerCase().includes(s)),
    'Bullet points':      (cv.match(/[*\u2022\-]/g)||[]).length>5,
    'Quantified metrics': !!cv.match(/\d+%|\d+\s*min|mttr|sla|\d+x/i),
    'Employment dates':   !!cv.match(/20\d{2}/),
    'No tables/graphics': !cv.match(/<table|<img/i)
  };
  return{score:Object.values(checks).filter(Boolean).length/Object.keys(checks).length*100,checks};
}

function buildSummary(jd){
  const jn=norm(jd),allV=Object.values(VOCAB).flat();
  const freq=allV.map(w=>({w,c:(jn.match(new RegExp(w.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'))||[]).length})).filter(x=>x.c>0).sort((a,b)=>b.c-a.c);
  const top=freq.slice(0,5).map(x=>x.w.toUpperCase());
  return 'Senior DevOps Engineer with 4+ years at Tietoevry, designing and automating high-availability infrastructure on '+(top[0]||'AWS')+' for enterprise-grade platforms. Reduced deployment times from ~45 min to ~18 min across 10+ production services through '+(top[1]||'CI/CD')+' automation and '+(top[2]||'Terraform')+' IaC. Deep hands-on expertise in '+(top[3]||'Kubernetes')+', '+(top[4]||'Docker')+', and GitLab/GitHub pipelines. Proven ability to lead cross-functional teams, drive observability maturity, and own full DevOps delivery end-to-end.';
}

function suggestBullets(jd){
  const t=norm(jd),add=[];
  if(t.includes('lambda'))                            add.push('Integrated event-driven workflows using AWS Lambda for build/test notifications, auto-remediation, and infrastructure drift checks.');
  if(t.includes('cloudformation'))                    add.push('Authored reusable CloudFormation/Terraform modules with parameterised environments and policy-as-code gates across 3 AWS regions.');
  if(t.includes('argocd')||t.includes('gitops'))      add.push('Adopted GitOps with Argo CD and Helm for declarative cluster state management with automated sync, health checks, and rollback.');
  if(t.includes('sast')||t.includes('dast')||t.includes('sonarqube')) add.push('Embedded SAST/DAST and container image scanning (Trivy/SonarQube) as mandatory quality gates; blocked 12+ critical CVEs pre-prod.');
  if(t.includes('cost')||t.includes('finops'))        add.push('Optimised cloud spend via right-sizing, Reserved Instances, and S3 lifecycle rules \u2014 reducing monthly AWS bill by ~18%.');
  if(t.includes('datadog'))                           add.push('Deployed Datadog APM with custom dashboards and anomaly-based alerting for P1 incident auto-escalation.');
  if(t.includes('eks')||t.includes('kubernetes'))     add.push('Managed multi-tenant EKS cluster (30+ microservices) with HPA, Cluster Autoscaler, and namespace-level RBAC isolation.');
  if(t.includes('terraform'))                         add.push('Maintained Terraform monorepo with shared modules, remote state (S3 + DynamoDB lock), and drift detection via scheduled plans.');
  if(t.includes('prometheus')||t.includes('grafana')) add.push('Built unified observability stack: Prometheus + Grafana + Loki + Alertmanager, with 40+ custom dashboards and PagerDuty integration.');
  if(t.includes('python')||t.includes('fastapi'))     add.push('Developed internal DevOps CLI tools and FastAPI microservices for infrastructure self-service, reducing ops tickets by 30%.');
  if(t.includes('security')||t.includes('rbac')||t.includes('zero trust')) add.push('Implemented zero-trust network segmentation with strict RBAC, Vault-managed secrets rotation, and quarterly access reviews.');
  if(t.includes('azure')||t.includes('gcp')||t.includes('multi-cloud'))   add.push('Designed multi-cloud networking (AWS + Azure) with Transit Gateway, VPN tunnels, and unified IAM federation.');
  if(t.includes('kafka')||t.includes('streaming'))    add.push('Integrated Apache Kafka message streaming for decoupled service communication; managed topics, consumer groups, and schema registry.');
  if(t.includes('disaster recovery')||t.includes('rto')||t.includes('rpo')) add.push('Designed and tested DR runbooks achieving RTO < 15 min and RPO < 5 min using multi-AZ RDS and Route53 failover.');
  if(t.includes('compliance')||t.includes('soc2'))    add.push('Led SOC2 Type II compliance initiative: implemented audit logging, data retention policies, and automated evidence collection.');
  return add;
}

// ── Analyze ───────────────────────────────────────────────────────────────────
function analyze(){
  const jd=document.getElementById('jd').value.trim();
  const cv=document.getElementById('cv').value.trim();
  if(!jd){setMsg('Paste a job description first.');return;}
  if(!cv){setMsg('Resume is empty.');return;}
  const btn=document.getElementById('score-btn');
  btn.classList.add('loading'); btn.textContent='Analyzing\u2026'; setMsg('');
  setTimeout(()=>{
    try{
      const{score:ks,cats}=scoreKeywords(jd,cv);
      const{score:ss,checks}=scoreStructure(cv);
      const ats=Math.round(0.65*ks+0.35*ss);
      const summary=buildSummary(jd);
      const bullets=suggestBullets(jd);
      lastSummary=summary;
      lastReport={ats_score:ats,keyword_score:Math.round(ks),structure_score:Math.round(ss),categories:cats,structure_checks:checks,tailored_summary:summary,suggested_bullets:bullets,generated_at:new Date().toISOString()};
      renderResults(ats,ks,ss,cats,checks,summary,bullets);
      saveHistory(lastReport,jd);
      renderHistory();
    }catch(err){setMsg('Error: '+err.message);}
    finally{btn.classList.remove('loading');btn.textContent='Score ATS match';}
  },60);
}

// ── Render results ────────────────────────────────────────────────────────────
function renderResults(ats,ks,ss,cats,checks,summary,bullets){
  const color=ats>=75?'var(--accent)':ats>=55?'var(--warn)':'var(--danger)';
  const sEl=document.getElementById('s-num');
  sEl.style.color=color;
  const ring=document.getElementById('score-ring');
  ring.style.stroke=color; ring.getBoundingClientRect();
  ring.style.strokeDashoffset=(339.292*(1-ats/100)).toFixed(3);
  countUp(sEl,ats,1100);
  const bEl=document.getElementById('s-badge');
  if(ats>=75){bEl.innerHTML='<span class="badge badge-good">Strong match</span>';updateTopBadge(ats+'% \xb7 Strong match','good');}
  else if(ats>=55){bEl.innerHTML='<span class="badge badge-mid">Moderate match</span>';updateTopBadge(ats+'% \xb7 Moderate match','mid');}
  else{bEl.innerHTML='<span class="badge badge-low">Needs improvement</span>';updateTopBadge(ats+'% \xb7 Needs improvement','low');}
  document.getElementById('bar-kw').style.width=Math.round(ks)+'%';
  document.getElementById('bar-str').style.width=Math.round(ss)+'%';
  document.getElementById('v-kw').textContent=Math.round(ks)+'%';
  document.getElementById('v-str').textContent=Math.round(ss)+'%';
  const tip=document.getElementById('score-tip');
  tip.textContent=ats<75?'Tip: '+(75-ats)+' more points \u2192 Strong match':'\u2713 Resume exceeds ATS threshold';
  const cg=document.getElementById('cat-grid'); cg.innerHTML='';
  for(const[cat,data] of Object.entries(cats)){
    const tot=(data.matched.length+data.missing.length)||1;
    const pct=Math.round(data.matched.length/tot*100);
    const col=CAT_COLORS[cat]||'var(--accent)';
    const cc=document.createElement('div'); cc.className='cat-card';
    cc.innerHTML=`<div class="cat-name">${cat}</div><div class="cat-pct" style="color:${col}">${pct}%</div><div class="bar-bg"><div class="bar-fill" style="width:${pct}%;background:${col}"></div></div>`;
    cg.appendChild(cc);
  }
  const cl=document.getElementById('chk-list'); cl.innerHTML='';
  for(const[k,v] of Object.entries(checks)){
    const d=document.createElement('div'); d.className='chk';
    d.innerHTML=`<span class="ci" style="color:${v?'var(--accent)':'var(--danger)'}">${v?'\u2713':'\u2717'}</span><span>${k}</span>`;
    cl.appendChild(d);
  }
  const kd=document.getElementById('kw-detail'); kd.innerHTML='';
  for(const[cat,data] of Object.entries(cats)){
    const row=document.createElement('div'); row.className='kw-row';
    let html=`<div class="kw-cat-name">${cat}</div><div class="tags">`;
    data.matched.forEach(t=>{html+=`<span class="tag tg">${t}</span>`;});
    data.missing.forEach(t=>{html+=`<span class="tag tr">${t}</span>`;});
    if(!data.matched.length&&!data.missing.length) html+='<span style="font-size:11px;color:var(--text3)">No JD terms</span>';
    row.innerHTML=html+'</div>'; kd.appendChild(row);
  }
  document.getElementById('summary-box').textContent=summary;
  if(bullets.length){
    const bl=document.getElementById('bullets-list'); bl.innerHTML='';
    bullets.forEach(b=>{
      const row=document.createElement('div'); row.className='bullet-row';
      const safe=b.replace(/\\/g,'\\\\').replace(/'/g,"\\'");
      row.innerHTML=`<div class="bullet">&#8226; ${b}</div><button class="btn-copy-bullet" onclick="copyBullet(this,'${safe}')">Copy</button>`;
      bl.appendChild(row);
    });
    document.getElementById('bullets-card').style.display='block';
  } else { document.getElementById('bullets-card').style.display='none'; }
  document.getElementById('results').classList.add('show');
  document.getElementById('results').scrollIntoView({behavior:'smooth',block:'start'});
  document.getElementById('btn-share-hdr').style.display='inline-block';
  document.getElementById('btn-print').style.display='inline-block';
  updateCharCount('jd'); updateCharCount('cv');
}

function countUp(el,target,duration){
  const start=performance.now();
  function tick(now){const p=Math.min((now-start)/duration,1),e=1-Math.pow(1-p,3);el.textContent=Math.round(e*target)+'%';if(p<1)requestAnimationFrame(tick);}
  requestAnimationFrame(tick);
}
function updateTopBadge(text,level){
  const el=document.getElementById('top-badge'); el.textContent=text;
  if(level==='good')     el.style.cssText='background:var(--accent-light);color:var(--accent-dark);border:0.5px solid var(--accent-border)';
  else if(level==='mid') el.style.cssText='background:var(--warn-light);color:var(--warn);border:0.5px solid var(--warn-border)';
  else                   el.style.cssText='background:var(--danger-light);color:var(--danger);border:0.5px solid var(--danger-border)';
}

// ── History ───────────────────────────────────────────────────────────────────
function renderHistory(){
  const history=loadHistory();
  const countEl=document.getElementById('history-count'),body=document.getElementById('history-body');
  if(countEl) countEl.textContent=history.length+' saved';
  if(!body) return;
  body.innerHTML='';
  if(!history.length){body.innerHTML='<div class="history-empty">No past analyses yet.</div>';return;}
  history.forEach(item=>{
    const color=item.ats_score>=75?'var(--accent)':item.ats_score>=55?'var(--warn)':'var(--danger)';
    const div=document.createElement('div'); div.className='history-item';
    div.innerHTML=`<div class="history-score" style="color:${color}">${item.ats_score}%</div><div class="history-meta"><div class="history-jd">${item.jd_snippet||'\u2014'}</div><div class="history-date">${new Date(item.timestamp).toLocaleString()} \xb7 KW ${item.keyword_score}% \xb7 Struct ${item.structure_score}%</div></div>`;
    body.appendChild(div);
  });
}
function toggleHistory(){
  document.getElementById('history-toggle').classList.toggle('open');
  document.getElementById('history-body').classList.toggle('open');
}

// ── Share URL ─────────────────────────────────────────────────────────────────
function shareReport(){
  if(!lastReport){setMsg('Run analysis first.');return;}
  try{
    const compact={a:lastReport.ats_score,k:lastReport.keyword_score,s:lastReport.structure_score,c:Object.fromEntries(Object.entries(lastReport.categories).map(([k,v])=>[k,Math.round(v.matched.length/Math.max(v.matched.length+v.missing.length,1)*100)])),t:Date.now()};
    const hash=btoa(unescape(encodeURIComponent(JSON.stringify(compact))));
    const url=location.href.split('#')[0]+'#share='+hash;
    navigator.clipboard.writeText(url).then(()=>{setMsg('\uD83D\uDD17 Shareable link copied!');setTimeout(()=>setMsg(''),3000);});
  }catch(e){setMsg('Share failed: '+e.message);}
}
function checkShareHash(){
  if(!location.hash.startsWith('#share=')) return;
  try{
    const data=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(7)))));
    const banner=document.getElementById('share-banner'),text=document.getElementById('share-banner-text');
    if(banner&&text){
      const color=data.a>=75?'#1D9E75':data.a>=55?'#BA7517':'#A32D2D';
      text.innerHTML=`\uD83D\uDCCA Shared ATS score: <strong style="color:${color}">${data.a}%</strong> \xb7 Keywords ${data.k}% \xb7 Structure ${data.s}%`;
      banner.classList.add('show');
    }
  }catch(e){}
}

// ── Actions ───────────────────────────────────────────────────────────────────
function askClaudeSummary(){
  const jd=document.getElementById('jd').value.trim();
  if(!jd||!lastReport){alert('Run analysis first.');return;}
  const matched=Object.entries(lastReport.categories).map(([c,d])=>c+': '+(d.matched.join(', ')||'none')).join(' | ');
  const msg='Please rewrite my Professional Summary.\n\nMatched keywords: '+matched+'\n\nJD (first 700 chars):\n'+jd.slice(0,700)+'\n\nCurrent summary:\n'+lastSummary+'\n\nWrite 2-3 ATS-optimised sentences mirroring JD language. Keep it factual.';
  if(window.sendPrompt) window.sendPrompt(msg); else{navigator.clipboard.writeText(msg);alert('Prompt copied!');}
}
function askClaudeBullets(){
  const jd=document.getElementById('jd').value.trim();
  if(!jd||!lastReport){alert('Run analysis first.');return;}
  const missing=Object.entries(lastReport.categories).flatMap(([,d])=>d.missing).join(', ')||'none';
  const msg='Tailor my DevOps resume. Missing keywords: '+missing+'\n\nJD:\n'+jd.slice(0,700)+'\n\nSuggest 3-5 specific bullets (only tech I actually used). Include metrics. Ready-to-paste format.';
  if(window.sendPrompt) window.sendPrompt(msg); else{navigator.clipboard.writeText(msg);alert('Prompt copied!');}
}
function copySummary(){ navigator.clipboard.writeText(lastSummary).then(()=>{setMsg('Copied!');setTimeout(()=>setMsg(''),1800);}); }
function copyBullet(btn,text){ navigator.clipboard.writeText(text).then(()=>{const o=btn.textContent;btn.textContent='\u2713 Copied';setTimeout(()=>{btn.textContent=o;},1600);}); }
function setMsg(t){ document.getElementById('msg').textContent=t; }

function resetAll(){
  document.getElementById('jd').value=''; document.getElementById('cv').value=''; saveResume('');
  document.getElementById('results').classList.remove('show');
  const tb=document.getElementById('top-badge'); tb.textContent='No score yet'; tb.style.cssText='';
  const ring=document.getElementById('score-ring');
  if(ring){ring.style.strokeDashoffset='339.292';ring.style.stroke='var(--accent)';}
  const snum=document.getElementById('s-num'); if(snum){snum.textContent='0%';snum.style.color='var(--accent)';}
  document.getElementById('btn-share-hdr').style.display='none';
  document.getElementById('btn-print').style.display='none';
  lastReport=null;lastSummary='';setMsg('');
  updateCharCount('jd');updateCharCount('cv');
}

// ── Fixed PDF filename ────────────────────────────────────────────────────────
function getPDFFilename(){
  // Always: Prakash_Pawar_Senior_DevOps_Engineer_DDMMYYYY.pdf
  const d=new Date();
  const dd=String(d.getDate()).padStart(2,'0');
  const mm=String(d.getMonth()+1).padStart(2,'0');
  const yyyy=d.getFullYear();
  return 'Prakash_Pawar_Senior_DevOps_Engineer_'+dd+mm+yyyy+'.pdf';
}

// ── TXT export ────────────────────────────────────────────────────────────────
function dlTXT(){
  if(!lastSummary){alert('Run analysis first.');return;}
  const lines=[RD.name,RD.title,RD.contact,'','PROFESSIONAL SUMMARY',lastSummary,'','TECHNICAL SKILLS',...RD.skills.map(s=>s.l+': '+s.v),'','PROFESSIONAL EXPERIENCE',...RD.experience.map(e=>e.company+' -- '+e.role+' ('+e.period+')\n'+e.bullets.map(b=>'* '+b).join('\n')),'','KEY PROJECTS',...RD.projects.map(p=>'* '+p.name+'\n  '+p.stack+'\n'+p.bullets.map(b=>'  * '+b).join('\n')),'','EDUCATION',RD.education.degree+'\n'+RD.education.uni,'','CERTIFICATIONS & AWARDS',...RD.certs.map(c=>'* '+c)];
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([lines.join('\n')],{type:'text/plain'}));
  a.download=getPDFFilename().replace('.pdf','.txt'); a.click();
}
function dlJSON(){
  if(!lastReport) return;
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([JSON.stringify(lastReport,null,2)],{type:'application/json'}));
  a.download='ats_report.json'; a.click();
}

// ── PDF Download ──────────────────────────────────────────────────────────────
function downloadPDF(){
  if(!lastSummary){alert('Please click "Score ATS match" first.');return;}
  if(typeof MiniPDF==='undefined'){setMsg('PDF engine not loaded. Refresh the page.');return;}
  try{setMsg('Building PDF\u2026');buildResumePDF();setMsg('');}
  catch(e){setMsg('PDF error: '+e.message);console.error(e);}
}

// ════════════════════════════════════════════════════════════════════════════════
// PDF BUILDER — exactly matches Prakash_Pawar_Resume-Devops.pdf format
// Letter size (612×792). Guaranteed 2 pages, never 3.
// ════════════════════════════════════════════════════════════════════════════════
function buildResumePDF(){
  const doc = new MiniPDF();
  // Build ATS-tailored clone of resume data (missing keywords injected)
  const TRD = buildTailoredResume();

  // ── Page: Letter 612 x 792 pts ─────────────────────────────────────────
  const PW = 612, PH = 792;
  const ML = 54, MR = 54, MT = 52;
  const CW = PW - ML - MR;   // 504 pt usable width

  // ── Colour palette matching original PDF ──────────────────────────────────
  const BLACK  = [15,  15,  15 ];  // name
  const BLUE   = [30,  90,  180];  // title, section heads, rules
  const DBODY  = [55,  55,  55 ];  // body / bullet text
  const SUBGRY = [110, 110, 110];  // company, period, promoted-from
  const FGRAY  = [150, 150, 150];  // faint italic stack lines (visibly lighter)
  const FTRGRY = [185, 185, 185];  // footer

  let y = MT;
  function setC(a)  { doc.setColor(a[0],a[1],a[2]); }
  function setLC(a) { doc.setLineColor(a[0],a[1],a[2]); }

  function wrapBlock(text, x, startY, maxW, lineH){
    const lines = doc.splitTextToSize(String(text), maxW);
    lines.forEach((ln, i) => doc.text(ln, x, startY + i * lineH));
    return startY + lines.length * lineH;
  }

  function secHead(label){
    y += 10;
    doc.setFont('bold'); doc.setFontSize(8.5); setC(BLUE);
    doc.text(label, ML, y);
    y += 4;
    setLC(BLUE); doc.setLineWidth(0.8);
    doc.hline(ML, y, ML + CW);
    y += 9;
  }

  function bulletRow(text, indentX, maxW, lineH){
    const lines = doc.splitTextToSize(String(text), maxW);
    doc.text('\u2022', indentX, y);
    lines.forEach((ln, i) => doc.text(ln, indentX + 12, y + i * lineH));
    y += lines.length * lineH;
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 1
  // ════════════════════════════════════════════════════════════════════════

  // Name
  doc.setFont('bold'); doc.setFontSize(26); setC(BLACK);
  doc.text(RD.name, ML, y);
  y += 20;

  // Title - blue
  doc.setFont('normal'); doc.setFontSize(12); setC(BLUE);
  doc.text(RD.title, ML, y);
  y += 13;

  // Contact
  doc.setFont('normal'); doc.setFontSize(9); setC(DBODY);
  doc.text(RD.contact, ML, y);
  y += 7;

  // Full-width blue rule
  setLC(BLUE); doc.setLineWidth(1.3);
  doc.hline(ML, y, ML + CW);
  y += 5;

  // PROFESSIONAL SUMMARY
  secHead('PROFESSIONAL SUMMARY');
  doc.setFont('normal'); doc.setFontSize(9); setC(DBODY);
  y = wrapBlock(lastSummary, ML, y, CW, 13);
  y += 3;

  // TECHNICAL SKILLS - 2-column table: bold label | normal value
  secHead('TECHNICAL SKILLS');
  const LCOLW = 115;
  doc.setFontSize(9);
  for(const sk of TRD.skills){
    const rowTop = y;
    doc.setFont('bold');   setC(BLACK);
    const lblLines = doc.splitTextToSize(sk.l, LCOLW - 6);
    lblLines.forEach((ln, i) => doc.text(ln, ML, rowTop + i * 13));
    doc.setFont('normal'); setC(DBODY);
    const valLines = doc.splitTextToSize(sk.v, CW - LCOLW);
    valLines.forEach((ln, i) => doc.text(ln, ML + LCOLW, rowTop + i * 13));
    y = rowTop + Math.max(lblLines.length, valLines.length) * 13;
  }
  y += 3;

  // PROFESSIONAL EXPERIENCE
  secHead('PROFESSIONAL EXPERIENCE');
  for(const exp of TRD.experience){
    // Role bold + period right-aligned
    doc.setFont('bold'); doc.setFontSize(10); setC(BLACK);
    doc.text(exp.role, ML, y);
    doc.setFontSize(9); doc.setFont('normal'); setC(SUBGRY);
    const pw = doc.getTextWidth(exp.period);
    doc.text(exp.period, ML + CW - pw, y);
    y += 13;

    // Company + optional italic sub note
    doc.setFont('normal'); doc.setFontSize(9); setC(SUBGRY);
    if(exp.sub){
      const base = exp.company + '  |  ';
      doc.text(base, ML, y);
      doc.setFont('italic');
      doc.text(exp.sub, ML + doc.getTextWidth(base), y);
      doc.setFont('normal');
    } else {
      doc.text(exp.company, ML, y);
    }
    y += 13;

    // Bullets
    doc.setFont('normal'); doc.setFontSize(9); setC(DBODY);
    for(const b of exp.bullets) bulletRow(b, ML + 2, CW - 14, 13);
    y += 6;
  }

  // ════════════════════════════════════════════════════════════════════════
  // PAGE 2  (hard break - guaranteed 2-page resume)
  // ════════════════════════════════════════════════════════════════════════
  doc.addPage();
  y = MT;

  // KEY PROJECTS
  secHead('KEY PROJECTS');
  for(const p of TRD.projects){
    // Project name - bold 10pt black
    doc.setFont('bold'); doc.setFontSize(10); setC(BLACK);
    y = wrapBlock(p.name, ML, y, CW, 13);
    y += 1;

    // Stack line - italic 8.5pt FAINT gray (clearly lighter than body)
    doc.setFont('italic'); doc.setFontSize(8.5); setC(FGRAY);
    y = wrapBlock(p.stack, ML, y, CW, 12);
    y += 3;

    // Bullets
    doc.setFont('normal'); doc.setFontSize(9); setC(DBODY);
    for(const b of p.bullets) bulletRow(b, ML + 2, CW - 14, 13);
    y += 8;
  }

  // EDUCATION + CERTIFICATIONS & AWARDS (side by side)
  const GAP   = 22;
  const HALFW = (CW - GAP) / 2;
  const COL_R = ML + HALFW + GAP;

  // Two blue headings on same line with individual underlines
  doc.setFont('bold'); doc.setFontSize(8.5); setC(BLUE);
  doc.text('EDUCATION', ML, y);
  doc.text('CERTIFICATIONS \u0026 AWARDS', COL_R, y);
  y += 4;
  setLC(BLUE); doc.setLineWidth(0.8);
  doc.hline(ML,    y, ML + HALFW);
  doc.hline(COL_R, y, COL_R + HALFW);
  y += 11;

  // Education left col
  const yEduTop = y;
  doc.setFont('bold');   doc.setFontSize(9); setC(BLACK);
  const degLines = doc.splitTextToSize(RD.education.degree, HALFW);
  degLines.forEach((ln, i) => doc.text(ln, ML, yEduTop + i * 13));
  const yUni = yEduTop + degLines.length * 13 + 3;
  doc.setFont('normal'); setC(SUBGRY);
  const uniLines = doc.splitTextToSize(RD.education.uni, HALFW);
  uniLines.forEach((ln, i) => doc.text(ln, ML, yUni + i * 13));

  // Certifications right col (bullet list aligned to yEduTop)
  let yR = yEduTop;
  doc.setFont('normal'); doc.setFontSize(9); setC(DBODY);
  for(const c of RD.certs){
    const cLines = doc.splitTextToSize(c, HALFW - 12);
    doc.text('\u2022', COL_R + 2, yR);
    cLines.forEach((ln, i) => doc.text(ln, COL_R + 13, yR + i * 13));
    yR += cLines.length * 13 + 5;
  }

  // Footer on both pages
  const fname = getPDFFilename();
  for(let i = 0; i < 2; i++){
    doc.curPage = doc.pages[i];
    doc.setFontSize(7.5); doc.setFont('normal'); setC(FTRGRY);
    doc.text('Prakash Pawar  |  prakash.n.pawar1610@gmail.com', ML, PH - 22);
    const pg = 'Page ' + (i + 1) + ' of 2';
    doc.text(pg, PW - MR - doc.getTextWidth(pg), PH - 22);
  }

  doc.save(fname);
}


// ── Init ──────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', ()=>{
  // Clear any old cached resume from previous versions
  try{ localStorage.removeItem('ats_resume_v2'); }catch(e){}
  const saved = loadResume();
  cvEl.value = saved || '';  // empty by default — anyone pastes their own resume
  cvEl.addEventListener('input',()=>{saveResume(cvEl.value);updateCharCount('cv');});
  document.getElementById('jd').addEventListener('input',()=>updateCharCount('jd'));
  wireUpload('upload-jd-btn','upload-jd','jd',false);
  wireUpload('upload-cv-btn','upload-cv','cv',true);
  updateCharCount('jd'); updateCharCount('cv');
  renderHistory();
  checkShareHash();
});
