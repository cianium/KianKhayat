import fs from 'node:fs';
import {stringify} from 'yaml';
const field=(name,label,type='string',extra={})=>({name,label,type,...extra});
const required=(name,label,type='string',extra={})=>field(name,label,type,{required:true,...extra});
const url=(name,label)=>field(name,label,'string',{pattern:{regex:'^https?://[^\\s]+$',message:'نشانی کامل با https:// وارد کن؛ یا فیلد را خالی بگذار.'}});
const list=(name,label)=>required(name,label,'string',{list:{min:1,collapsible:false}});
const shared=[
  required('slug','شناسهٔ آدرس','string',{pattern:'^[a-z0-9]+(?:-[a-z0-9]+)*$',description:'انگلیسی و خط تیره؛ پس از انتشار تغییر نده. نمونه: my-project'}),
  required('order','ترتیب نمایش','number',{default:10,options:{min:0},description:'عدد صحیح؛ عدد کمتر بالاتر نمایش داده می‌شود.'}),

];
const links=field('links','پیوندها','object',{list:{collapsible:{collapsed:true,summary:'{label}'}},fields:[required('label','متن دکمه'),required('url','نشانی کامل','string',{pattern:'^https?://[^\\s]+$'}),field('primary','پیوند اصلی','boolean',{default:false})]});
const image=(name,label,media)=>field(name,label,'image',{options:{media,rename:'random',extensions:['png','jpg','jpeg','webp','avif','gif']}});
const projectFields=(translated=false)=>[
  required('title','نام پروژه'),required('summary','شرح پروژه','text'),list('tags','فناوری‌ها'),
  translated?required('status','وضعیت به زبان همین بخش'):required('status','وضعیت','select',{default:'Planned',options:{values:[{name:'Live',label:'منتشرشده'},{name:'In Progress',label:'در حال انجام'},{name:'Building',label:'در حال ساخت'},{name:'Planned',label:'برنامه‌ریزی‌شده'}]}}),
  links,field('documentation','مستندات','text',{description:'متن ساده؛ بین پاراگراف‌ها یک خط خالی بگذار.'}),
];
const certificateFields=[required('name','عنوان مدرک'),required('issuer','صادرکننده'),required('date','تاریخ نمایشی'),required('description','شرح','text')];
const articleFields=[required('title','عنوان مقاله'),required('summary','خلاصه','text'),list('categories','دسته‌ها'),required('date','تاریخ نمایشی'),required('body','متن مقاله','rich-text',{options:{format:'html',media:'article_images',rename:'random',switcher:true},description:'از ویرایشگر بصری استفاده کن. برای بخش‌ها عنوان سطح ۳ انتخاب کن.'})];
const translations=(fields,project=false)=>required('translations','ترجمه‌ها','object',{fields:['fa','de'].map(lang=>required(lang,lang==='fa'?'فارسی':'آلمانی','object',{fields:[...fields,...(project&&lang==='fa'?[required('seoTitle','نام کاملاً فارسی برای جست‌وجو','string',{pattern:{regex:'^[^A-Za-z]+$',message:'در این فیلد فقط نام فارسی بنویس.'}})]:[])]}))});
const collection=(name,label,primary,fields)=>({name,label,type:'collection',path:`src/content/${name}`,format:'json',subfolders:false,filename:{template:'{fields.slug}.json',field:false},operations:{create:true,delete:true,rename:false},view:{primary,fields:[primary,'order'],sort:['order',primary],search:[primary,'slug'],default:{sort:'order',order:'asc'}},fields});
const config={
  media:[
    {name:'featured_images',label:'تصاویر برگزیده‌ها',input:'public/media/featured',output:'/media/featured',rename:'random',extensions:['png','jpg','jpeg','webp','avif','gif']},
    {name:'project_images',label:'تصویر پروژه‌ها',input:'public/media/projects',output:'/media/projects',rename:'random',extensions:['png','jpg','jpeg','webp','avif','gif']},
    {name:'certificate_images',label:'تصویر مدارک',input:'public/media/certificates',output:'/media/certificates',rename:'random',extensions:['png','jpg','jpeg','webp','avif','gif']},
    {name:'certificate_pdfs',label:'فایل PDF مدارک',input:'public/media/certificates',output:'/media/certificates',rename:'random',extensions:['pdf']},
    {name:'article_images',label:'تصویر مقاله‌ها',input:'public/media/articles',output:'/media/articles',rename:'random',extensions:['png','jpg','jpeg','webp','avif','gif']},
  ],
  content:[
    collection('featured','برگزیده‌ها','title',[...shared,required('title','عنوان کارت'),required('summary','توضیح کارت','text'),required('url','نشانی مقصد','string',{pattern:'^(https?://|/(?!/))',description:'صفحهٔ پروژه، مقاله، فایل مدرک یا یک نشانی بیرونی.'}),image('image','تصویر کارت','featured_images'),field('emoji','نماد جایگزین','string',{default:'⭐'}),field('published','نمایش در سایت','boolean',{default:true}),field('translations','ترجمه‌های اختیاری','object',{fields:['fa','de'].map(lang=>field(lang,lang==='fa'?'فارسی':'آلمانی','object',{fields:[required('title','عنوان'),required('summary','توضیح','text')]}))})]),
    collection('projects','پروژه‌ها','title',[...shared,...projectFields(),required('emoji','نماد پروژه','string',{default:'🌐'}),field('colorA','رنگ اول','string',{hidden:true,default:'#DDB967'}),field('colorB','رنگ دوم','string',{hidden:true,default:'#B08940'}),image('thumbnail','تصویر پروژه','project_images'),url('liveUrl','نشانی نمایش زنده'),url('githubUrl','نشانی گیت‌هاب'),translations(projectFields(true),true)]),
    collection('certificates','مدارک','name',[...shared,...certificateFields.map(f=>f.name==='date'?{...f,pattern:'^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \\d{4}$',description:'مثال: Oct 2026؛ تاریخ ترجمه‌ها آزاد است.'}:f),required('category','گروه','select',{options:{values:[{name:'python',label:'پایتون'},{name:'web',label:'وب'},{name:'linux',label:'لینوکس'},{name:'goethe',label:'آلمانی'}]}}),required('emoji','نماد مدرک','string',{default:'🎓'}),image('image','تصویر مدرک','certificate_images'),field('pdf','فایل PDF','file',{options:{media:'certificate_pdfs',extensions:['pdf'],rename:'random'}}),url('credentialUrl','پیوند رسمی اعتبارسنجی'),translations(certificateFields)]),
    collection('articles','مقاله‌ها','title',[...shared,field('draft','پیش‌نویس؛ هنوز منتشر نشود','boolean',{default:true}),required('language','زبان اصلی مقاله','string',{default:'en',pattern:'^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})*$',description:'کد زبان: fa، en، de، ar، tr و …؛ متن با زبان سایت تغییر نمی‌کند.'}),...articleFields,field('readingTimeMode','زمان مطالعه','select',{default:'auto',options:{values:[{name:'auto',label:'خودکار'},{name:'manual',label:'دستی'}]}}),field('readTime','زمان مطالعهٔ دستی'),field('toc','فهرست مطالب خودکار','boolean',{default:true}),field('seoTitle','عنوان سئو'),field('seoDescription','توضیح نتیجهٔ جست‌وجو','text'),field('focusKeyword','عبارت کلیدی هدف','string',{description:'عبارت اصلی مقاله؛ گزارش بررسی پس از ذخیره در GitHub Actions ساخته می‌شود. تکرار مصنوعی کلمات لازم نیست.'}),field('updatedAt','آخرین ویرایش','date',{default:'',options:{format:'yyyy-MM-dd'}}),field('publishedAt','روز دقیق انتشار','date',{default:'',options:{format:'yyyy-MM-dd'},description:'اگر روز دقیق را نمی‌دانی خالی بگذار.'}),image('cover','تصویر روی جلد','article_images'),field('coverAlt','توضیح تصویر روی جلد')]),
  ],
  settings:{content:{merge:true}},
};
fs.writeFileSync('.pages.yml','# Generated by scripts/generate-cms.mjs. GitHub credentials are managed by Pages CMS.\n'+stringify(config));
console.log('Generated .pages.yml: four collections, single-language articles and five media sources.');
