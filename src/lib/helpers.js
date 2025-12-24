const bcrypt = require('bcryptjs');
const json2csv = require('json2csv').parse;
const moment = require('moment');
const helpers = {};

helpers.encryptPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);
  return hash;
};

helpers.matchPassword = async (password, savedPassword) => {
  try {
    return await bcrypt.compare(password, savedPassword);
  } catch (e) {
    console.log(e)
  }
};

helpers.decorateFormFields = (fields, errors = false, form_data = false, actual_data = false) => {
  let res = {};
  let err = {};
  if (errors) {
    for (let error of errors) {
      err[error.param] = { "msg": error.msg, "value": error.value };
    }
  }
  for (let field of fields) {
    if (field in err) {
      res[field] = { validity: "is-invalid", msg: err[field].msg };
    } else {
      res[field] = { validity: "", msg: "" };
    }
    if (actual_data) {
      res[field].value = actual_data[field];
    } else {
      res[field].value = form_data[field];
    }
  }
  return res;
};

helpers.paginate = (total_page, cur_page) => {
    let item = '';
    let prev_disabled = (cur_page <= 1) ? "disabled" : "";
    let prev_href = parseInt(cur_page - 1);
    
    item += `<li class="page-item ${prev_disabled}"><a class="page-link btn-outline-site btn-sm" data-link-no="${prev_href}" href="javascript:void(0)" tabindex="-1">Previous</a></li>`;
    for(i = 1; i <= total_page; i++) {
        let active = (i == cur_page) ? "active" : "";
        item += `<li class="page-item ${active}"><a class="page-link btn-outline-site btn-sm" data-link-no="${i}" href="javascript:void(0)">${i}</a></li>`;
    }
    let next_disabled = cur_page >= total_page ? "disabled" : "";
    let next_href = parseInt(cur_page) + 1;
    item += `<li class="page-item ${next_disabled}"><a class="page-link btn-outline-site btn-sm" data-link-no="${next_href}" href="javascript:void(0)">Next</a></li>`;
    return item;
};

helpers.downloasAsCSV = async (filename, data, res) => {
    const csvString = json2csv(data);
    res.setHeader('Content-disposition', `attachment; filename=${filename}.csv`);
    res.set('Content-Type', 'text/csv');
    res.status(200).send(csvString);
};

helpers.generateTrnxId = () => {
  return Math.random().toString(36).substring(7) + moment().format('YYYYMMDDhhmmss');
};

helpers.generateUniqueId = () => {
  return moment().format('x').substr(-5) + Math.random().toString().replace('0.', '').substr(-5);
};

helpers.generateOTP = () => {
  return moment().format('x').substr(-5) + Math.random().toString().replace('0.', '').substr(-4);
};
helpers.getCurrentTime = () => {
  return moment().format('YYYY-MM-DD hh:mm:ss');
}

helpers.existMobileNemail = (data) => {
  let res = false;
  let regexEmail = /\w+([-+.']\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*/;
  let regexMobile = /\+?(88)?0?1[3456789 _\-][0-9]{3,50}\b/g;
  // let regexMobileBN = /\+?(৮৮)?০?[\u09E6-\u09EF][0-9]{4,50}/g;
  let regexMobileBN = /[০-৯ ]{4,20}$/;
  if (regexEmail.test(data) || regexMobile.test(data) || regexMobileBN.test(data)) {
      res = true;
  }
  return res;
}

module.exports = helpers;
