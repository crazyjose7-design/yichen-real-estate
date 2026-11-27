import test from 'node:test';
import assert from 'node:assert/strict';
import { evaluateRewardStack } from '../workbench/modules/reward-engine.mjs';

const approved = {
 id:'reward-a',status:'verified',application_policy:{auto_apply:true},verified_by:'reviewer-1',
 source:{url:'https://law.moj.gov.tw/',provision:'第6條',agency:'內政部'},
 effective_from:'2026-01-01',effective_to:null,jurisdiction:'TW-KHH',
 approval_record:{id:'KHH-APP-001',status:'approved'},additional_volume:100,
 combination_group:'green-building',combination_rule:'exclusive'
};
test('unverified rewards are blocked and never added to land efficiency volume',()=>{
 const r=evaluateRewardStack({baseVolume:1000,items:[{...approved,status:'in_review',application_policy:{auto_apply:false}}],calculationDate:'2026-11-27',jurisdiction:'TW-KHH'});
 assert.equal(r.status,'blocked');assert.equal(r.approvedAdditionalVolume,0);assert.equal(r.resultingVolume,null);
});
test('a verified, effective, jurisdiction-matched and individually approved item can be calculated',()=>{
 const r=evaluateRewardStack({baseVolume:1000,items:[approved],calculationDate:'2026-11-27',jurisdiction:'TW-KHH',statutoryCapVolume:1200});
 assert.equal(r.status,'verified');assert.equal(r.resultingVolume,1100);assert.deepEqual(r.appliedItems,['reward-a']);
});
test('same exclusive reward group cannot be double counted',()=>{
 const r=evaluateRewardStack({baseVolume:1000,items:[approved,{...approved,id:'reward-b'}],calculationDate:'2026-11-27',jurisdiction:'TW-KHH'});
 assert.equal(r.status,'blocked');assert.equal(r.conflicts.length,1);assert.equal(r.resultingVolume,null);
});
test('a different jurisdiction is blocked',()=>{
 const r=evaluateRewardStack({baseVolume:1000,items:[{...approved,jurisdiction:'TW-TPE'}],calculationDate:'2026-11-27',jurisdiction:'TW-KHH'});
 assert.equal(r.status,'blocked');assert.match(r.blocked[0].reasons.join(','),/轄區/);
});
test('a result above statutory cap is blocked',()=>{
 const r=evaluateRewardStack({baseVolume:1000,items:[approved],calculationDate:'2026-11-27',jurisdiction:'TW-KHH',statutoryCapVolume:1050});
 assert.equal(r.status,'blocked');assert.match(r.conflicts[0].reason,/法定總量上限/);
});
