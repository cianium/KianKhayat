// Test-only bytes, served exclusively when the browser test server enables TEST_MEDIA.
export function testPDF() {
  const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R] /Count 1 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>'];
  let body='%PDF-1.4\n';const offsets=[0];
  objects.forEach((object,i)=>{offsets.push(new TextEncoder().encode(body).length);body+=`${i+1} 0 obj\n${object}\nendobj\n`});
  const xref=new TextEncoder().encode(body).length;
  body+=`xref\n0 4\n0000000000 65535 f \n${offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')}trailer\n<< /Size 4 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return body;
}
