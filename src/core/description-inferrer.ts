/**
 * 智能描述推断器
 * 从方法名、类名、代码模式自动推断业务描述
 */

// 常见动词映射（英文 -> 中文描述）
const VERB_MAPPINGS: Record<string, string> = {
  // CRUD 操作
  create: '创建',
  add: '添加',
  insert: '新增',
  save: '保存',
  
  update: '更新',
  modify: '修改',
  edit: '编辑',
  change: '变更',
  
  delete: '删除',
  remove: '移除',
  cancel: '取消',
  
  get: '获取',
  set: '设置',
  find: '查找',
  query: '查询',
  search: '搜索',
  list: '列表',
  fetch: '获取',
  load: '加载',
  
  // 业务操作
  submit: '提交',
  approve: '审批',
  reject: '拒绝',
  confirm: '确认',
  verify: '验证',
  validate: '校验',
  check: '检查',
  
  send: '发送',
  notify: '通知',
  push: '推送',
  publish: '发布',
  
  process: '处理',
  handle: '处理',
  execute: '执行',
  run: '运行',
  
  calculate: '计算',
  compute: '计算',
  count: '统计',
  sum: '汇总',
  
  export: '导出',
  import: '导入',
  download: '下载',
  upload: '上传',
  
  login: '登录',
  logout: '登出',
  register: '注册',
  auth: '认证',
  
  lock: '锁定',
  unlock: '解锁',
  enable: '启用',
  disable: '禁用',
  activate: '激活',
  deactivate: '停用',
  
  pay: '支付',
  refund: '退款',
  transfer: '转账',
  withdraw: '提现',
  recharge: '充值',
  
  assign: '分配',
  dispatch: '派发',
  distribute: '分发',
  allocate: '分配',
  
  start: '开始',
  stop: '停止',
  pause: '暂停',
  resume: '恢复',
  finish: '完成',
  complete: '完成',
  close: '关闭',
  open: '打开',
  
  bind: '绑定',
  unbind: '解绑',
  link: '关联',
  unlink: '解关联',
  
  sync: '同步',
  refresh: '刷新',
  reset: '重置',
  init: '初始化',
  initialize: '初始化',
  
  convert: '转换',
  transform: '转换',
  format: '格式化',
  parse: '解析',
  
  copy: '复制',
  clone: '克隆',
  merge: '合并',
  split: '拆分',
  
  batch: '批量',
  bulk: '批量',
};

// 常见名词映射（英文 -> 中文）
const NOUN_MAPPINGS: Record<string, string> = {
  // 通用业务对象
  order: '订单',
  orders: '订单',
  user: '用户',
  users: '用户',
  account: '账户',
  accounts: '账户',
  product: '商品',
  products: '商品',
  item: '项目',
  items: '项目',
  cart: '购物车',
  payment: '支付',
  transaction: '交易',
  balance: '余额',
  
  customer: '客户',
  member: '会员',
  admin: '管理员',
  role: '角色',
  permission: '权限',
  
  message: '消息',
  notification: '通知',
  email: '邮件',
  sms: '短信',
  
  file: '文件',
  image: '图片',
  document: '文档',
  attachment: '附件',
  
  config: '配置',
  setting: '设置',
  option: '选项',
  param: '参数',
  parameter: '参数',
  
  log: '日志',
  record: '记录',
  history: '历史',
  audit: '审计',
  
  task: '任务',
  job: '作业',
  schedule: '调度',
  workflow: '工作流',
  
  report: '报表',
  statistics: '统计',
  dashboard: '仪表盘',
  
  address: '地址',
  contact: '联系人',
  phone: '电话',
  
  category: '分类',
  tag: '标签',
  label: '标签',
  
  comment: '评论',
  review: '评价',
  feedback: '反馈',
  
  coupon: '优惠券',
  discount: '折扣',
  promotion: '促销',
  
  inventory: '库存',
  stock: '库存',
  warehouse: '仓库',
  
  shipment: '发货',
  delivery: '配送',
  logistics: '物流',
  express: '快递',
  
  invoice: '发票',
  receipt: '收据',
  bill: '账单',
  
  contract: '合同',
  agreement: '协议',
  
  dept: '部门',
  department: '部门',
  org: '组织',
  organization: '组织',
  company: '公司',
  
  driver: '司机',
  vehicle: '车辆',
  route: '路线',
  trip: '行程',
  
  // 技术对象
  token: '令牌',
  session: '会话',
  cache: '缓存',
  queue: '队列',
  
  id: 'ID',
  ids: 'ID列表',
  code: '编码',
  status: '状态',
  state: '状态',
  type: '类型',
  name: '名称',
  title: '标题',
  desc: '描述',
  description: '描述',
  
  list: '列表',
  detail: '详情',
  info: '信息',
  data: '数据',
  result: '结果',
  response: '响应',
  request: '请求',
  
  page: '分页',
  size: '大小',
  total: '总数',
  count: '数量',
  
  start: '开始',
  end: '结束',
  begin: '开始',
  finish: '结束',
  
  time: '时间',
  date: '日期',
  datetime: '日期时间',
  timestamp: '时间戳',
  
  amount: '金额',
  price: '价格',
  cost: '成本',
  fee: '费用',
  
  all: '全部',
  by: '按',
  with: '带',
  without: '不带',
};

// 操作模式检测（预编译正则，收紧匹配避免误命中）
// 标签统一为"数据访问"语义，避免强行区分 MyBatis/MyBatis-Plus
const OPERATION_PATTERNS: Array<{
  pattern: RegExp;
  label: string;
  priority: number;
}> = [
  // ========== 数据库操作 - 强证据（带明确语义后缀） ==========
  // JPA/Spring Data 风格（强证据：*ById/*All）
  { pattern: /\.(?:save|persist)\s*\(/i, label: '数据写入', priority: 2 },
  { pattern: /\.saveAll\s*\(/i, label: '批量写入', priority: 1 },
  { pattern: /\.(?:deleteById|removeById)\s*\(/i, label: '数据删除', priority: 1 },
  { pattern: /\.(?:findById|getById|selectById)\s*\(/i, label: '数据查询', priority: 1 },
  { pattern: /\.(?:findAll|selectList|listAll)\s*\(/i, label: '数据查询', priority: 1 },
  
  // MyBatis Mapper 调用（强证据：xxxMapper.select*/insert*/update*/delete*）
  { pattern: /(?:this\.)?\w+Mapper\.(?:select|insert|update|delete)\w*\s*\(/i, label: '数据访问', priority: 1 },
  // SqlSession/SqlSessionTemplate（强证据）
  { pattern: /\bSqlSession(?:Template)?\b[\s\S]*?\.\s*select(?:One|List|Map)?\s*\(/i, label: '数据查询', priority: 1 },
  { pattern: /\bSqlSession(?:Template)?\b[\s\S]*?\.\s*insert\s*\(/i, label: '数据写入', priority: 1 },
  { pattern: /\bSqlSession(?:Template)?\b[\s\S]*?\.\s*update\s*\(/i, label: '数据更新', priority: 1 },
  { pattern: /\bSqlSession(?:Template)?\b[\s\S]*?\.\s*delete\s*\(/i, label: '数据删除', priority: 1 },
  // MyBatis 注解 SQL（强证据）
  { pattern: /@Select\b/i, label: '数据查询', priority: 1 },
  { pattern: /@Insert\b/i, label: '数据写入', priority: 1 },
  { pattern: /@Update\b/i, label: '数据更新', priority: 1 },
  { pattern: /@Delete\b/i, label: '数据删除', priority: 1 },
  
  // MyBatis-Plus（强证据：带明确 MP 语义的方法）
  { pattern: /\.(?:getById|getOne|getBaseMapper)\s*\(/i, label: '数据查询', priority: 1 },
  { pattern: /\.(?:updateById|updateBatchById)\s*\(/i, label: '数据更新', priority: 1 },
  { pattern: /\.(?:removeById|removeByIds|removeBatchByIds)\s*\(/i, label: '数据删除', priority: 1 },
  { pattern: /\.(?:saveBatch|saveOrUpdate|saveOrUpdateBatch)\s*\(/i, label: '批量写入', priority: 1 },
  { pattern: /\.(?:selectPage|page)\s*\([^)]*\b(?:Page|IPage)\b/i, label: '分页查询', priority: 1 },
  { pattern: /\b(?:LambdaQueryWrapper|QueryWrapper|Wrappers\.(?:lambdaQuery|query))\b/i, label: '条件查询', priority: 2 },
  { pattern: /\b(?:LambdaUpdateWrapper|UpdateWrapper|Wrappers\.(?:lambdaUpdate|update))\b/i, label: '条件更新', priority: 2 },
  
  // ========== 其他操作 ==========
  { pattern: /\bValidator\b/i, label: '数据验证', priority: 2 },
  { pattern: /@Valid\b/i, label: '参数校验', priority: 1 },
  { pattern: /@Validated\b/i, label: '参数校验', priority: 1 },
  { pattern: /\bAssert\./i, label: '断言校验', priority: 2 },
  
  // 事务
  { pattern: /@Transactional\b/i, label: '事务管理', priority: 1 },
  { pattern: /\bTransactionTemplate\b/i, label: '事务管理', priority: 1 },
  
  // 外部调用
  { pattern: /\bRestTemplate\b/i, label: '外部API调用', priority: 1 },
  { pattern: /\bWebClient\b/i, label: '外部API调用', priority: 1 },
  { pattern: /\bFeignClient\b/i, label: 'Feign调用', priority: 1 },
  { pattern: /\bHttpClient\b/i, label: '外部API调用', priority: 1 },
  { pattern: /\bOkHttpClient\b/i, label: '外部API调用', priority: 1 },
  
  // 缓存
  { pattern: /@Cacheable\b/i, label: '缓存读取', priority: 1 },
  { pattern: /@CacheEvict\b/i, label: '缓存清除', priority: 1 },
  { pattern: /@CachePut\b/i, label: '缓存更新', priority: 1 },
  { pattern: /\bRedisTemplate\b/i, label: 'Redis操作', priority: 1 },
  { pattern: /\bStringRedisTemplate\b/i, label: 'Redis操作', priority: 1 },
  { pattern: /\bRedisson\b/i, label: 'Redis操作', priority: 1 },
  
  // 消息队列
  { pattern: /\bKafkaTemplate\b/i, label: 'Kafka消息', priority: 1 },
  { pattern: /\bRabbitTemplate\b/i, label: 'RabbitMQ消息', priority: 1 },
  { pattern: /\bRocketMQTemplate\b/i, label: 'RocketMQ消息', priority: 1 },
  { pattern: /\bJmsTemplate\b/i, label: 'JMS消息', priority: 1 },
  { pattern: /@RabbitListener\b/i, label: '消息监听', priority: 1 },
  { pattern: /@KafkaListener\b/i, label: '消息监听', priority: 1 },
  
  // 文件操作
  { pattern: /\bMultipartFile\b/i, label: '文件上传', priority: 1 },
  { pattern: /\bjava\.io\.File\b/i, label: '文件操作', priority: 1 },
  { pattern: /\bFiles\./i, label: '文件操作', priority: 1 },
  { pattern: /\bInputStream\b/i, label: '流操作', priority: 2 },
  { pattern: /\bOutputStream\b/i, label: '流操作', priority: 2 },
  
  // 加密
  { pattern: /\bencrypt\b/i, label: '数据加密', priority: 1 },
  { pattern: /\bdecrypt\b/i, label: '数据解密', priority: 1 },
  { pattern: /\bDigestUtils\b/i, label: '摘要处理', priority: 1 },
  { pattern: /\bBCrypt\b/i, label: '密码加密', priority: 1 },
  
  // 异步
  { pattern: /@Async\b/i, label: '异步处理', priority: 1 },
  { pattern: /\bCompletableFuture\b/i, label: '异步处理', priority: 1 },
  { pattern: /\bExecutorService\b/i, label: '线程池处理', priority: 1 },
  { pattern: /\bThreadPoolExecutor\b/i, label: '线程池处理', priority: 1 },
  
  // 锁
  { pattern: /\bReentrantLock\b/i, label: '并发锁', priority: 1 },
  { pattern: /\bsynchronized\b/i, label: '同步锁', priority: 1 },
  { pattern: /\bSemaphore\b/i, label: '信号量控制', priority: 1 },
  { pattern: /\bRLock\b/i, label: '分布式锁', priority: 1 },
];

/**
 * 从方法名推断业务描述
 */
export function inferMethodDescription(methodName: string): string {
  // 解析方法名（驼峰命名）
  const words = splitCamelCase(methodName);
  if (words.length === 0) return '';

  // 处理常见前缀
  const firstWord = words[0].toLowerCase();
  
  // 处理 is/has/can 前缀 -> "是否xxx"
  if (['is', 'has', 'can'].includes(firstWord)) {
    const restNouns = words.slice(1).map(n => {
      const lower = n.toLowerCase();
      return NOUN_MAPPINGS[lower] || n;
    }).join('');
    if (firstWord === 'is') return `是否${restNouns}`;
    if (firstWord === 'has') return `是否拥有${restNouns}`;
    if (firstWord === 'can') return `是否可${restNouns}`;
  }
  
  // 处理 on 前缀 -> "监听/处理xxx事件"
  if (firstWord === 'on') {
    const restNouns = words.slice(1).map(n => {
      const lower = n.toLowerCase();
      return NOUN_MAPPINGS[lower] || n;
    }).join('');
    return `监听${restNouns}事件`;
  }
  
  // 处理 do 前缀 -> 跳过前缀，直接处理后续词（不递归回字符串，避免破坏大小写边界）
  let effectiveWords = words;
  let effectiveVerb = firstWord;
  if (firstWord === 'do' && words.length > 1) {
    effectiveWords = words.slice(1);
    effectiveVerb = effectiveWords[0].toLowerCase();
  }
  
  // 处理 get/set 前缀（JavaBean getter/setter 特殊处理）
  // 如果只有 get/set + 单个简单名词（如 getId/getName），视为字段访问，返回简化描述
  if ((effectiveVerb === 'get' || effectiveVerb === 'set') && effectiveWords.length === 2) {
    const nounWord = effectiveWords[1].toLowerCase();
    // 如果是典型字段名词，返回简化描述
    if (['id', 'name', 'code', 'type', 'status', 'value', 'key', 'index'].includes(nounWord)) {
      const nounCn = NOUN_MAPPINGS[nounWord] || effectiveWords[1];
      return effectiveVerb === 'get' ? `获取${nounCn}` : `设置${nounCn}`;
    }
  }

  // 提取动词（通常是第一个词）
  const verb = effectiveVerb;
  const verbCn = VERB_MAPPINGS[verb];

  // 提取名词（其余词），处理结构词 by/with/and/or/from/to
  const nouns = effectiveWords.slice(1);
  const { mainPart, modifierPart } = parseNounsWithStructureWords(nouns);

  if (verbCn && mainPart) {
    return modifierPart ? `${verbCn}${mainPart}（${modifierPart}）` : `${verbCn}${mainPart}`;
  } else if (verbCn) {
    return verbCn;
  } else if (mainPart) {
    return modifierPart ? `处理${mainPart}（${modifierPart}）` : `处理${mainPart}`;
  }

  return '';
}

/**
 * 解析名词列表，识别结构词 by/with/and/or/from/to
 * 支持多段解析：listUserByDeptAndStatus => 列表用户（按部门和状态）
 */
function parseNounsWithStructureWords(nouns: string[]): { mainPart: string; modifierPart: string } {
  const structureWords: Record<string, string> = {
    by: '按',
    with: '包含',
    without: '不含',
    and: '和',
    or: '或',
    from: '从',
    to: '到',
    for: '为',
  };
  
  // 找到第一个主结构词（by/with/without/from/for）的位置
  const primaryStructureWords = ['by', 'with', 'without', 'from', 'for'];
  let splitIndex = -1;
  let structureWord = '';
  for (let i = 0; i < nouns.length; i++) {
    const lower = nouns[i].toLowerCase();
    if (primaryStructureWords.includes(lower)) {
      splitIndex = i;
      structureWord = structureWords[lower];
      break;
    }
  }
  
  if (splitIndex === -1) {
    // 没有结构词，全部作为主体
    const mainPart = nouns.map(n => {
      const lower = n.toLowerCase();
      return NOUN_MAPPINGS[lower] || n;
    }).join('');
    return { mainPart, modifierPart: '' };
  }
  
  // 有结构词，分割成主体和修饰部分
  const mainNouns = nouns.slice(0, splitIndex);
  const modifierNouns = nouns.slice(splitIndex + 1);
  
  const mainPart = mainNouns.map(n => {
    const lower = n.toLowerCase();
    return NOUN_MAPPINGS[lower] || n;
  }).join('');
  
  // 修饰部分支持多段解析：DeptAndStatus => 部门和状态，DateToDate => 日期到日期
  const modifierPart = parseModifierTokens(modifierNouns, structureWord, structureWords);
  
  return { mainPart, modifierPart };
}

/**
 * 解析修饰部分的 token，支持 and/or/to 等连接词
 */
function parseModifierTokens(
  tokens: string[],
  prefix: string,
  structureWords: Record<string, string>
): string {
  if (tokens.length === 0) return '';
  
  const result: string[] = [];
  let currentGroup: string[] = [];
  
  for (const token of tokens) {
    const lower = token.toLowerCase();
    // and/or/to/from 作为连接词
    if (['and', 'or', 'to', 'from'].includes(lower) && currentGroup.length > 0) {
      // 先输出当前组
      result.push(currentGroup.map(t => {
        const l = t.toLowerCase();
        return NOUN_MAPPINGS[l] || t;
      }).join(''));
      // 添加连接词
      result.push(structureWords[lower] || lower);
      currentGroup = [];
    } else {
      currentGroup.push(token);
    }
  }
  
  // 处理最后一组
  if (currentGroup.length > 0) {
    result.push(currentGroup.map(t => {
      const l = t.toLowerCase();
      return NOUN_MAPPINGS[l] || t;
    }).join(''));
  }
  
  return result.length > 0 ? `${prefix}${result.join('')}` : '';
}

/**
 * 从类名推断类的业务描述
 */
export function inferClassDescription(className: string, classType: string): string {
  // 移除后缀（按最长后缀优先原则排序，避免 OrderServiceImpl 先被去掉 Service 变成 OrderImpl）
  // DO/DTO/VO 使用大小写敏感匹配，避免误删 Todo 等类名
  let baseName = className
    .replace(/ServiceImpl$/, '')   // 先处理 ServiceImpl（大小写敏感）
    .replace(/Controller$/i, '')
    .replace(/Repository$/i, '')
    .replace(/Service$/, '')       // 再处理 Service（大小写敏感）
    .replace(/Mapper$/i, '')
    .replace(/(DAO|Dao)$/, '')     // 只支持 DAO/Dao，不匹配 dao
    .replace(/Entity$/i, '')
    .replace(/DTO$/, '')           // 大小写敏感，避免误删
    .replace(/VO$/, '')            // 大小写敏感
    .replace(/DO$/, '')            // 大小写敏感，避免 Todo 误伤
    .replace(/Impl$/, '');         // 大小写敏感

  const words = splitCamelCase(baseName);
  const nounsCn = words.map(w => {
    const lower = w.toLowerCase();
    return NOUN_MAPPINGS[lower] || w;
  }).join('');

  const typeLabels: Record<string, string> = {
    controller: '控制器 - 处理HTTP请求',
    service: '服务 - 业务逻辑处理',
    repository: '仓储 - 数据访问层',
    entity: '实体 - 数据模型',
    dto: '数据传输对象',
    utility: '工具类',
    middleware: '中间件',
    guard: '守卫 - 权限控制',
    other: '',
  };

  const typeLabel = typeLabels[classType] || '';
  
  if (nounsCn && typeLabel) {
    return `${nounsCn}${typeLabel}`;
  } else if (nounsCn) {
    return `${nounsCn}管理`;
  }

  return '';
}

/**
 * 从代码片段检测操作模式
 */
export function detectOperationPatterns(codeSnippet: string): string[] {
  const detected: Array<{ label: string; priority: number }> = [];

  for (const { pattern, label, priority } of OPERATION_PATTERNS) {
    // pattern 已经是预编译的 RegExp，直接使用
    if (pattern.test(codeSnippet)) {
      // 避免重复
      if (!detected.some(d => d.label === label)) {
        detected.push({ label, priority });
      }
    }
  }

  // 按优先级排序，取前3个
  return detected
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(d => d.label);
}

/**
 * 生成方法的完整业务描述
 */
export function generateMethodBusinessDescription(
  methodName: string,
  codeSnippet?: string,
  jsDocDescription?: string
): string {
  // 优先使用 JSDoc 描述
  if (jsDocDescription && jsDocDescription.trim().length > 0) {
    return jsDocDescription.trim();
  }

  // 从方法名推断
  const inferred = inferMethodDescription(methodName);
  
  // 检测操作模式
  const operations = codeSnippet ? detectOperationPatterns(codeSnippet) : [];

  if (inferred && operations.length > 0) {
    return `${inferred}（${operations.join('、')}）`;
  } else if (inferred) {
    return inferred;
  } else if (operations.length > 0) {
    return operations.join('、');
  }

  return '';
}

/**
 * 生成字段的业务描述
 */
export function inferFieldDescription(fieldName: string, fieldType: string): string {
  const words = splitCamelCase(fieldName);
  const firstWord = words[0]?.toLowerCase() || '';
  
  // Boolean 类型特殊处理："是否" 前置更自然
  const isBoolean = fieldType === 'Boolean' || fieldType === 'boolean';
  if (isBoolean) {
    // 如果字段名以 is/has/can 开头，去掉前缀后翻译
    if (['is', 'has', 'can'].includes(firstWord)) {
      const restWords = words.slice(1);
      const translated = restWords.map(w => {
        const lower = w.toLowerCase();
        return NOUN_MAPPINGS[lower] || w;
      }).join('');
      return `是否${translated}`;
    }
    // 其他 Boolean 字段直接 "是否xxx"
    const translated = words.map(w => {
      const lower = w.toLowerCase();
      return NOUN_MAPPINGS[lower] || w;
    }).join('');
    return `是否${translated}`;
  }
  
  // 非 Boolean 字段按原逻辑处理
  const translated = words.map(w => {
    const lower = w.toLowerCase();
    return NOUN_MAPPINGS[lower] || w;
  }).join('');

  // 根据类型添加额外信息
  const typeHints: Record<string, string> = {
    'Date': '（时间）',
    'LocalDateTime': '（日期时间）',
    'LocalDate': '（日期）',
    'BigDecimal': '（金额）',
    'Long': '',
    'Integer': '',
    'String': '',
  };

  const typeHint = typeHints[fieldType] || '';
  
  return translated ? `${translated}${typeHint}` : '';
}

/**
 * 分割驼峰命名
 */
function splitCamelCase(name: string): string[] {
  if (!name) return [];
  
  // 插入分隔符
  const spaced = name
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/_/g, ' ');

  return spaced.split(' ').filter(w => w.length > 0);
}

/**
 * 推断 Controller 的 API 描述
 */
export function inferApiDescription(
  method: string,
  path: string,
  handlerName: string
): string {
  const methodLabels: Record<string, string> = {
    GET: '查询',
    POST: '创建/提交',
    PUT: '更新',
    DELETE: '删除',
    PATCH: '部分更新',
  };

  const methodLabel = methodLabels[method.toUpperCase()] || method;
  const handlerDesc = inferMethodDescription(handlerName);

  // 检查 handlerDesc 是否已包含动词（避免重复叠加 methodLabel）
  const verbPatterns = ['创建', '更新', '删除', '获取', '查询', '添加', '修改', '移除', '保存', '新增', '查找', '搜索', '列表', '提交', '审批', '处理', '验证', '发送'];
  const hasVerb = handlerDesc && verbPatterns.some(v => handlerDesc.startsWith(v));

  if (handlerDesc) {
    if (hasVerb) {
      // handlerDesc 已包含动词，直接使用
      return `[${method}] ${handlerDesc}`;
    } else {
      // handlerDesc 不以动词开头，用 methodLabel 增强（加空格分隔更自然）
      return `[${method}] ${methodLabel} ${handlerDesc}`;
    }
  }

  // 从路径推断，此时用 methodLabel 作为动词
  const pathParts = path.split('/').filter(p => p && !p.startsWith(':') && !p.startsWith('{'));
  if (pathParts.length > 0) {
    const lastPart = pathParts[pathParts.length - 1];
    const noun = NOUN_MAPPINGS[lastPart.toLowerCase()] || lastPart;
    return `[${method}] ${methodLabel}${noun}`;
  }

  return `[${method}] ${path}`;
}

/**
 * 生成调用链描述
 */
export function generateCallChainDescription(callChain: string[]): string {
  if (callChain.length === 0) return '';

  const arrows = callChain.map((cls, index) => {
    if (index === 0) return cls;
    return ` → ${cls}`;
  }).join('');

  return `调用链: ${arrows}`;
}
