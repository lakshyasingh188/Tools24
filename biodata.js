document.addEventListener("DOMContentLoaded", () => {

const inputs = {

fullName: document.getElementById("fullName"),
birthdatetime: document.getElementById("birthdatetime"),
birthplace: document.getElementById("birthplace"),
height: document.getElementById("height"),
hobbies: document.getElementById("hobbies"),
education: document.getElementById("education"),
language: document.getElementById("language"),
occupation: document.getElementById("occupation"),
marital: document.getElementById("marital"),

gotra: document.getElementById("gotra"),
gan: document.getElementById("gan"),
cast: document.getElementById("cast"),

father: document.getElementById("father"),
mother: document.getElementById("mother"),
grandfather: document.getElementById("grandfather"),
brother: document.getElementById("brother"),
sister: document.getElementById("sister"),
mama: document.getElementById("mama"),

contact: document.getElementById("contact"),
whatsapp: document.getElementById("whatsapp"),
address: document.getElementById("address")

};

const resumeDocument = document.getElementById("resume-document");
const downloadBtn = document.getElementById("download-btn");
const photoUpload = document.getElementById("photoUpload");
const previewPhoto = document.getElementById("previewPhoto");

let photoData = "";



/* PHOTO UPLOAD */

photoUpload.addEventListener("change",function(){

const file = this.files[0];

if(file){

const reader = new FileReader();

reader.onload = function(e){

photoData = e.target.result;

previewPhoto.src = photoData;

updatePreview();

};

reader.readAsDataURL(file);

}

});



/* HTML GENERATOR */

function generateHTML(){

return `

<div class="biodata">

<div style="text-align:center;margin-bottom:20px">

<img src="${photoData || ''}" 
style="width:130px;height:130px;border-radius:50%;object-fit:cover;border:3px solid #444">

<h1>${inputs.fullName?.value || "Your Name"}</h1>

<h3 style="color:#4f46e5;">BIODATA / बायोडाटा</h3>

</div>

<hr>


<h2>PERSONAL DETAILS / व्यक्तिगत जानकारी</h2>

<table>

<tr>
<td>Birth Date & Time / जन्म तिथि व समय</td>
<td>${inputs.birthdatetime?.value || ""}</td>
</tr>

<tr>
<td>Birthplace / जन्म स्थान</td>
<td>${inputs.birthplace?.value || ""}</td>
</tr>

<tr>
<td>Height / लंबाई</td>
<td>${inputs.height?.value || ""}</td>
</tr>

<tr>
<td>Hobbies / शौक</td>
<td>${inputs.hobbies?.value || ""}</td>
</tr>

<tr>
<td>Education / शिक्षा</td>
<td>${inputs.education?.value || ""}</td>
</tr>

<tr>
<td>Language Known / भाषाएँ</td>
<td>${inputs.language?.value || ""}</td>
</tr>

<tr>
<td>Occupation / पेशा</td>
<td>${inputs.occupation?.value || ""}</td>
</tr>

<tr>
<td>Marital Status / वैवाहिक स्थिति</td>
<td>${inputs.marital?.value || ""}</td>
</tr>

</table>


<h2>HOROSCOPE / कुंडली</h2>

<table>

<tr>
<td>Gotra / गोत्र</td>
<td>${inputs.gotra?.value || ""}</td>
</tr>

<tr>
<td>Gan / गण</td>
<td>${inputs.gan?.value || ""}</td>
</tr>

<tr>
<td>Caste / जाति</td>
<td>${inputs.cast?.value || ""}</td>
</tr>

</table>


<h2>FAMILY BACKGROUND / पारिवारिक विवरण</h2>

<table>

<tr>
<td>Father Name / पिता का नाम</td>
<td>${inputs.father?.value || ""}</td>
</tr>

<tr>
<td>Mother Name / माता का नाम</td>
<td>${inputs.mother?.value || ""}</td>
</tr>

<tr>
<td>Grand Father Name / दादा का नाम</td>
<td>${inputs.grandfather?.value || ""}</td>
</tr>

<tr>
<td>Brother / भाई</td>
<td>${inputs.brother?.value || ""}</td>
</tr>

<tr>
<td>Sister / बहन</td>
<td>${inputs.sister?.value || ""}</td>
</tr>

<tr>
<td>Mama / मामा</td>
<td>${inputs.mama?.value || ""}</td>
</tr>

</table>


<h2>CONTACT / संपर्क</h2>

<table>

<tr>
<td>Contact No / मोबाइल नंबर</td>
<td>${inputs.contact?.value || ""}</td>
</tr>

<tr>
<td>WhatsApp / व्हाट्सएप</td>
<td>${inputs.whatsapp?.value || ""}</td>
</tr>

<tr>
<td>Address / पता</td>
<td>${inputs.address?.value || ""}</td>
</tr>

</table>

</div>

`;

}



/* UPDATE PREVIEW */

function updatePreview(){

resumeDocument.innerHTML = generateHTML();

}



/* INPUT LISTENERS */

Object.values(inputs).forEach(input => {

if(input){

input.addEventListener("input",updatePreview);

}

});



/* DOWNLOAD PDF */

downloadBtn.addEventListener("click", () => {

const opt = {

margin:0,
filename:"biodata.pdf",

image:{
type:"jpeg",
quality:0.98
},

html2canvas:{
scale:2
},

jsPDF:{
unit:"in",
format:"letter",
orientation:"portrait"
}

};

html2pdf().set(opt).from(resumeDocument).save();

});



updatePreview();

});
