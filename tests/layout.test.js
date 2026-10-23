const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function header(wx) {
  let component;
  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '../miniapp/components/app-header/index.js'), 'utf8'),
    { wx, Component(value) { component = value; } },
  );
  const instance = {
    data: { ...component.data },
    ...component.methods,
    setData(value) { Object.assign(this.data, value); },
  };
  component.lifetimes.attached.call(instance);
  return { component, instance };
}

test('刘海屏导航避让胶囊，切换窗口尺寸后重新计算', () => {
  let windowWidth = 390;
  const { component, instance } = header({
    getWindowInfo: () => ({ windowWidth, statusBarHeight: 47 }),
    getMenuButtonBoundingClientRect: () => ({ top: 51, height: 32, left: windowWidth - 94 }),
  });
  assert.equal(instance.data.top, 47);
  assert.equal(instance.data.height, 40);
  assert.equal(instance.data.right, 104);
  windowWidth = 320;
  component.pageLifetimes.resize.call(instance);
  assert.equal(instance.data.height, 40);
  assert.equal(instance.data.right, 104);
});

test('旧基础库与空胶囊数据保留可用导航尺寸', () => {
  const { instance } = header({
    getSystemInfoSync: () => ({ windowWidth: 360, statusBarHeight: 24 }),
    getMenuButtonBoundingClientRect: () => ({ top: 0, height: 0, left: 0 }),
  });
  assert.equal(instance.data.top, 24);
  assert.equal(instance.data.height, 44);
  assert.equal(instance.data.right, 96);
});
