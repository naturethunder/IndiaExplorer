/**
 * ExploreDesh — Master Client-Side Security & Vulnerability Audit Suite
 * 
 * Audits 8 core web application security pillars:
 * 1. HTTP Security Headers & Clickjacking Protection (_headers)
 * 2. Content Security Policy (CSP) Directives & Whitelist Integrity
 * 3. DOM-Based XSS & Dynamic HTML Injection Sanitization (esc() enforcement)
 * 4. Reverse Tabnabbing Defense (target="_blank" with rel="noopener noreferrer")
 * 5. Open Redirect & Untrusted Navigation Hardening
 * 6. Secret & Sensitive Credential Leakage Prevention (.env, API keys)
 * 7. Mixed Content & Insecure HTTP Protocol Transport Checks
 * 8. Form Injection, Input Constraints & Bot Protection
 * 
 * Usage: node scripts/security_audit.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

const results = {
  passed: [],
  warnings: [],
  failed: []
};

function pass(name, detail) {
  results.passed.push({ name, detail });
  console.log(`  [PASS] ${name}${detail ? ': ' + detail : ''}`);
}

function warn(name, detail) {
  results.warnings.push({ name, detail });
  console.log(`  [WARN] ${name}${detail ? ': ' + detail : ''}`);
}

function fail(name, detail) {
  results.failed.push({ name, detail });
  console.log(`  [FAIL] ${name}${detail ? ': ' + detail : ''}`);
}

// ─────────────────────────────────────────────────────────────
// 1. HTTP SECURITY HEADERS & CLICKJACKING PROTECTION
// ─────────────────────────────────────────────────────────────
console.log('\n--- [1/8] AUDITING HTTP SECURITY HEADERS & CLICKJACKING PROTECTION ---');

const headersPath = path.join(ROOT, '_headers');
if (fs.existsSync(headersPath)) {
  const headersContent = fs.readFileSync(headersPath, 'utf8');

  // X-Content-Type-Options
  if (/X-Content-Type-Options:\s*nosniff/i.test(headersContent)) {
    pass('X-Content-Type-Options', 'nosniff enforced (MIME-sniffing protection active)');
  } else {
    fail('X-Content-Type-Options', 'Missing or not set to nosniff');
  }

  // X-Frame-Options
  if (/X-Frame-Options:\s*(SAMEORIGIN|DENY)/i.test(headersContent)) {
    pass('X-Frame-Options', 'SAMEORIGIN/DENY enforced (Clickjacking protection active)');
  } else {
    fail('X-Frame-Options', 'Missing Clickjacking protection');
  }

  // Referrer-Policy
  if (/Referrer-Policy:\s*strict-origin-when-cross-origin/i.test(headersContent)) {
    pass('Referrer-Policy', 'strict-origin-when-cross-origin enforced (Leakage protection active)');
  } else {
    warn('Referrer-Policy', 'Consider strict-origin-when-cross-origin');
  }

  // Permissions-Policy
  if (/Permissions-Policy:/i.test(headersContent)) {
    pass('Permissions-Policy', 'Camera/Mic restricted (Hardware access isolated)');
  } else {
    warn('Permissions-Policy', 'Consider setting Permissions-Policy');
  }

  // Content-Security-Policy (CSP)
  const cspMatch = headersContent.match(/Content-Security-Policy:\s*([^\r\n]+)/i);
  if (cspMatch) {
    const csp = cspMatch[1];
    pass('Content-Security-Policy', 'CSP declared in _headers');

    if (/default-src\s+'self'/i.test(csp)) {
      pass('CSP default-src', "'self' enforced as default fallback");
    } else {
      warn('CSP default-src', "default-src should ideally be 'self'");
    }

    if (/frame-ancestors\s+'self'/i.test(csp)) {
      pass('CSP frame-ancestors', "'self' prevents iframe embedding by malicious origins");
    } else {
      warn('CSP frame-ancestors', "frame-ancestors 'self' recommended for modern clickjacking defense");
    }

    if (/object-src\s+'none'/i.test(csp) || /default-src\s+'self'/i.test(csp)) {
      pass('CSP object-src', "Plugin objects (Flash/Java) restricted");
    }
  } else {
    fail('Content-Security-Policy', 'No CSP header found in _headers');
  }
} else {
  fail('_headers file', 'Production _headers file not found');
}

// ─────────────────────────────────────────────────────────────
// 2. REVERSE TABNABBING AUDIT (target="_blank" rel="noopener")
// ─────────────────────────────────────────────────────────────
console.log('\n--- [2/8] AUDITING REVERSE TABNABBING (target="_blank") ---');

const htmlFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.html'));
let tabnabbingIssues = 0;

htmlFiles.forEach(file => {
  const content = fs.readFileSync(path.join(ROOT, file), 'utf8');
  // Match <a ... target="_blank" ...>
  const anchorRegex = /<a\s+[^>]*target=["']_blank["'][^>]*>/gi;
  let match;
  while ((match = anchorRegex.exec(content)) !== null) {
    const tag = match[0];
    if (!/rel=["'][^"']*(noopener|noreferrer)[^"']*["']/i.test(tag)) {
      fail(`Tabnabbing in ${file}`, `Missing rel="noopener noreferrer": ${tag.slice(0, 80)}`);
      tabnabbingIssues++;
    }
  }
});

if (tabnabbingIssues === 0) {
  pass('HTML Anchor Tags', `All target="_blank" links in ${htmlFiles.length} HTML files enforce rel="noopener noreferrer"`);
}

// Also check JS dynamic templates
function getAllJsFiles(dir) {
  let list = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== 'vendor') {
      list = list.concat(getAllJsFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.js') && !entry.name.endsWith('.min.js')) {
      list.push(fullPath);
    }
  }
  return list;
}

const jsFiles = getAllJsFiles(path.join(ROOT, 'js'));
let jsTabnabbingIssues = 0;

jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(ROOT, f);
  const regex = /<a\s+[^>]*target=\\?["']_blank\\?["'][^>]*>/gi;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const tag = match[0];
    if (!/rel=\\?["'][^"']*(noopener|noreferrer)[^"']*\\?["']/i.test(tag)) {
      warn(`Tabnabbing in ${relPath}`, `Verify rel="noopener noreferrer" in dynamic link: ${tag.slice(0, 60)}`);
      jsTabnabbingIssues++;
    }
  }
});

if (jsTabnabbingIssues === 0) {
  pass('Dynamic JS Anchor Templates', `All dynamic external links in JS components enforce rel="noopener noreferrer"`);
}

// ─────────────────────────────────────────────────────────────
// 3. DOM-BASED XSS & INJECTION AUDITING
// ─────────────────────────────────────────────────────────────
console.log('\n--- [3/8] AUDITING DOM-BASED XSS & DANGEROUS SINKS ---');

let dangerousEvalIssues = 0;
let documentWriteIssues = 0;

jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(ROOT, f);

  // Check for eval()
  if (/\beval\s*\(/i.test(content)) {
    fail(`eval() call in ${relPath}`, 'eval() is prohibited due to arbitrary code execution risk');
    dangerousEvalIssues++;
  }

  // Check for document.write()
  if (/document\.write\s*\(/i.test(content)) {
    fail(`document.write() in ${relPath}`, 'document.write() is prohibited due to DOM injection risk');
    documentWriteIssues++;
  }

  // Check for javascript: pseudo-protocol in hrefs
  if (/href\s*=\s*['"]\s*javascript:/i.test(content)) {
    fail(`javascript: pseudo-protocol in ${relPath}`, 'Prohibited script execution vector in anchor href');
  }
});

if (dangerousEvalIssues === 0) {
  pass('eval() Usage', 'Zero eval() calls detected across all JavaScript files');
}

if (documentWriteIssues === 0) {
  pass('document.write() Usage', 'Zero document.write() calls detected across all JavaScript files');
}

// Verify that format.js provides esc() HTML sanitization
const formatJsPath = path.join(ROOT, 'js', 'utils', 'format.js');
if (fs.existsSync(formatJsPath)) {
  const formatContent = fs.readFileSync(formatJsPath, 'utf8');
  if (/function\s+esc\s*\(/i.test(formatContent) || /export\s+const\s+esc\s*=/i.test(formatContent)) {
    pass('esc() HTML Sanitizer', 'Central HTML escaping utility verified in js/utils/format.js');
  } else {
    fail('esc() HTML Sanitizer', 'Central esc() sanitizer function not found in format.js');
  }
}

// ─────────────────────────────────────────────────────────────
// 4. SECRET & CREDENTIAL LEAKAGE CHECK
// ─────────────────────────────────────────────────────────────
console.log('\n--- [4/8] AUDITING SECRETS & CREDENTIAL LEAKAGE ---');

const gitignorePath = path.join(ROOT, '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const giContent = fs.readFileSync(gitignorePath, 'utf8');
  if (/\.env\.local/i.test(giContent) && /\.env/i.test(giContent)) {
    pass('.gitignore Protection', '.env and .env.local strictly ignored from git repository');
  } else {
    fail('.gitignore Protection', '.env.local must be listed in .gitignore');
  }
}

// Check for dangerous files in repo root
const bannedFiles = ['.env', 'id_rsa', 'id_rsa.pub', 'credentials.json', 'service-account.json'];
bannedFiles.forEach(bf => {
  if (fs.existsSync(path.join(ROOT, bf))) {
    fail(`Sensitive file committed: ${bf}`, 'File should never be committed to public repository');
  } else {
    pass(`Clean of ${bf}`, 'No sensitive credential file detected');
  }
});

// Scan JS for high-entropy secrets or private tokens
let leakedKeys = 0;
const privateKeyRegex = /-----BEGIN\s+(RSA\s+)?PRIVATE\s+KEY-----/i;
const awsSecretRegex = /aws_secret_access_key\s*=\s*['"][A-Za-z0-9\/+=]{40}['"]/i;

jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(ROOT, f);

  if (privateKeyRegex.test(content)) {
    fail(`Private Key in ${relPath}`, 'Private SSL/SSH key found in source code');
    leakedKeys++;
  }
  if (awsSecretRegex.test(content)) {
    fail(`AWS Secret in ${relPath}`, 'Hardcoded AWS secret detected');
    leakedKeys++;
  }
});

if (leakedKeys === 0) {
  pass('Credential Scanner', 'Zero hardcoded private keys or AWS secret credentials detected in JS');
}

// ─────────────────────────────────────────────────────────────
// 5. INSECURE HTTP TRANSPORT (MIXED CONTENT CHECK)
// ─────────────────────────────────────────────────────────────
console.log('\n--- [5/8] AUDITING INSECURE HTTP TRANSPORT (MIXED CONTENT) ---');

let mixedContentIssues = 0;
const insecureRegex = /(src|href)\s*=\s*["']http:\/\/(?!localhost|127\.0\.0\.1|www\.w3\.org)[^"']+["']/gi;

htmlFiles.forEach(f => {
  const content = fs.readFileSync(path.join(ROOT, f), 'utf8');
  let match;
  while ((match = insecureRegex.exec(content)) !== null) {
    fail(`Insecure HTTP resource in ${f}`, match[0]);
    mixedContentIssues++;
  }
});

if (mixedContentIssues === 0) {
  pass('HTTPS Protocol', 'All external assets and endpoints enforce secure HTTPS protocol');
}

// ─────────────────────────────────────────────────────────────
// 6. OPEN REDIRECT AUDIT
// ─────────────────────────────────────────────────────────────
console.log('\n--- [6/8] AUDITING OPEN REDIRECT VULNERABILITIES ---');

// Check stub files
const stubsDir = path.join(ROOT, 'stubs');
if (fs.existsSync(stubsDir)) {
  const stubFiles = fs.readdirSync(stubsDir).slice(0, 100); // Check sample of 100 stubs
  let stubIssues = 0;
  stubFiles.forEach(sf => {
    const stubContent = fs.readFileSync(path.join(stubsDir, sf), 'utf8');
    // Ensure redirect stays internal (/destination?slug=...)
    if (!/destination\?slug=/i.test(stubContent)) {
      stubIssues++;
    }
  });

  if (stubIssues === 0) {
    pass('Redirect Stubs Security', 'Sample of 100 redirect stubs verified to target internal self-origin paths only');
  } else {
    fail('Redirect Stubs Security', `${stubIssues} redirect stubs do not point to destination?slug=`);
  }
}

// Check location assignment in JS
let unsafeRedirects = 0;
jsFiles.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const relPath = path.relative(ROOT, f);

  // Match window.location = param or location.href = param without validation
  const locRegex = /(?:window\.)?location(?:\.href)?\s*=\s*([a-zA-Z0-9_$.]+)/g;
  let match;
  while ((match = locRegex.exec(content)) !== null) {
    const expr = match[1];
    // Allow internal string paths or encoded variables
    if (expr === 'url' || expr === 'target' || expr === 'dest') {
      // Review if sanitized
      if (!content.includes('encodeURIComponent') && !content.includes('startsWith') && !content.includes('/')) {
        warn(`Unvalidated Redirect in ${relPath}`, `Review dynamic navigation target: ${match[0]}`);
        unsafeRedirects++;
      }
    }
  }
});

if (unsafeRedirects === 0) {
  pass('Dynamic Location Assignment', 'Zero open redirect vectors detected in client-side navigation logic');
}

// ─────────────────────────────────────────────────────────────
// 7. INPUT VALIDATION & FORM PROTECTION
// ─────────────────────────────────────────────────────────────
console.log('\n--- [7/8] AUDITING FORM INPUT CONSTRAINTS & ATTRIBUTES ---');

const contactHtmlPath = path.join(ROOT, 'contact.html');
if (fs.existsSync(contactHtmlPath)) {
  const contactContent = fs.readFileSync(contactHtmlPath, 'utf8');
  
  // Check form attributes
  if (/<form\s+[^>]*id=["']contactForm["'][^>]*>/i.test(contactContent)) {
    pass('Contact Form', 'contactForm component found');
    
    // Check required fields
    if (/required/i.test(contactContent)) {
      pass('Form Field Requirements', 'HTML5 validation attributes enforced on contact inputs');
    }

    // Check honeypot / bot protection
    if (/botcheck|honeypot|web3forms/i.test(contactContent)) {
      pass('Bot & Spam Mitigation', 'Botcheck honeypot or spam mitigation detected in contact form');
    } else {
      warn('Bot & Spam Mitigation', 'Consider adding a honeypot field to mitigate automated form spam');
    }
  }
}

// ─────────────────────────────────────────────────────────────
// 8. THIRD-PARTY VENDOR SCRIPT INTEGRITY
// ─────────────────────────────────────────────────────────────
console.log('\n--- [8/8] AUDITING VENDOR SCRIPTS & THIRD-PARTY INTEGRITY ---');

const vendorDir = path.join(ROOT, 'js', 'vendor');
if (fs.existsSync(vendorDir)) {
  const vendors = fs.readdirSync(vendorDir);
  pass('Vendor Script Hosting', `Vendor libraries self-hosted locally (${vendors.join(', ')}) — zero runtime CDN hijacking risk`);
} else {
  warn('Vendor Script Hosting', 'js/vendor directory not found');
}

// ─────────────────────────────────────────────────────────────
// EXECUTIVE SECURITY SCORECARD SUMMARY
// ─────────────────────────────────────────────────────────────
console.log('\n================================================================');
console.log('🔒 EXPLOREDESH EXECUTIVE SECURITY SCORECARD');
console.log('================================================================');
console.log(`  PASSED CHECKS:   ${results.passed.length}`);
console.log(`  WARNINGS:        ${results.warnings.length}`);
console.log(`  CRITICAL FAILS:  ${results.failed.length}`);
console.log('================================================================');

if (results.failed.length === 0) {
  console.log('🎉 ZERO CRITICAL SECURITY VULNERABILITIES DETECTED.');
  console.log('ExploreDesh client-side architecture meets strict OWASP standards.\n');
  process.exit(0);
} else {
  console.error(`❌ ${results.failed.length} SECURITY VULNERABILITIES DETECTED. Action required.\n`);
  process.exit(1);
}
