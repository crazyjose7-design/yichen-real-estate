import test from 'node:test';
import assert from 'node:assert/strict';
import {selectVerifiedParameters,separateInputs} from '../workbench/modules/regulation-data-loader.mjs';
const base={status:'verified',application_policy:{auto_apply:true},official_parameters:[{id:'a',status:'verified',verified_by:'reviewer-2',jurisdiction:'TW-KHH',effective_from:'2026-01-01',effective_to:null,source:{url:'https://law.moj.gov.tw/',provision:'Article 1',agency:'MOI'}},{id:'b',status:'unverified',verified_by:null,jurisdiction:'TW-KHH',effective_from:'2026-01-01',source:{}},{id:'c',status:'verified',verified_by:'reviewer-2',jurisdiction:'TW-TPE',effective_from:'2026-01-01',source:{url:'https://law.moj.gov.tw/',provision:'Article 2',agency:'MOI'}}],user_assumptions:[{id:'u1',name:'user input',value:42}]};
test('only verified, sourced, effective and jurisdiction-matched parameters are selected',()=>{assert.deepEqual(selectVerifiedParameters(base,{date:'2026-11-27',jurisdiction:'TW-KHH'}).map(x=>x.id),['a']);});
test('unverified dataset never auto-applies',()=>{assert.deepEqual(selectVerifiedParameters({...base,status:'unverified'},{date:'2026-11-27'}),[]);});
test('disabled auto apply never returns official values',()=>{assert.deepEqual(selectVerifiedParameters({...base,application_policy:{auto_apply:false}},{date:'2026-11-27'}),[]);});
test('calculation date is mandatory and validated',()=>{assert.throws(()=>selectVerifiedParameters(base,{date:'today'}),/valid calculation date/);});
test('official values and user assumptions remain separate',()=>{const x=separateInputs({...base,status:'unverified'});assert.equal(x.official.length,0);assert.equal(x.assumptions.length,1);assert.equal(x.blockedCount,1);});
