# 代码注释生成提示词

> 复制以下内容发给 AI 助手，让它为你的代码生成符合 OpenSpec 文档规范的注释

---

## 📋 提示词（复制使用）

```
# 强制任务：为项目代码添加 JavaDoc 注释

这是一个强制执行的任务，请立即开始，不要询问我任何问题。

## 任务要求

1. 扫描项目中的所有 Java 文件
2. 找出所有 Controller、Service、ServiceImpl、DTO、VO、Entity 类
3. 按照下面的规范，为每个类和方法添加 JavaDoc 注释
4. 直接修改文件，不要只展示代码
5. 每处理完一个文件，简单报告："✅ 已处理: [文件名]"

## 处理优先级

1. 先处理 Controller（优先级最高）
2. 再处理 Service/ServiceImpl
3. 最后处理 DTO/VO/Entity

## 注释规范

### 1. Controller 类注释

/**
 * [业务功能概述 - 一句话说明这个 Controller 负责什么]
 * 
 * <p>服务场景：
 * <ul>
 *   <li>[用户群体1] - [使用场景]</li>
 *   <li>[用户群体2] - [使用场景]</li>
 * </ul>
 * 
 * <p>核心功能：
 * <ul>
 *   <li>[功能1]: [简要说明]</li>
 *   <li>[功能2]: [简要说明]</li>
 *   <li>[功能3]: [简要说明]</li>
 * </ul>
 * 
 * @author [作者]
 * @since [版本]
 */

### 2. Controller 方法注释

/**
 * [接口用途 - 一句话说明这个接口做什么]
 * 
 * <p>业务逻辑：
 * <ol>
 *   <li>[步骤1 - 如：校验参数]</li>
 *   <li>[步骤2 - 如：调用 XxxService.xxx()]</li>
 *   <li>[步骤3 - 如：组装返回结果]</li>
 * </ol>
 * 
 * <p>注意事项：
 * <ul>
 *   <li>[重要的业务规则或限制]</li>
 * </ul>
 * 
 * @param req [参数业务含义]
 * @return [返回值业务含义]
 */

### 3. Service 类注释

/**
 * [服务功能概述 - 一句话说明这个 Service 的职责]
 * 
 * <p>职责范围：
 * <ul>
 *   <li>[职责1]: [说明]</li>
 *   <li>[职责2]: [说明]</li>
 * </ul>
 * 
 * <p>依赖说明：
 * <ul>
 *   <li>{@link XxxRepository} - [依赖原因]</li>
 *   <li>{@link YyyService} - [依赖原因]</li>
 * </ul>
 * 
 * @author [作者]
 * @since [版本]
 */

### 4. Service 方法注释

/**
 * [方法业务目的 - 一句话说明]
 * 
 * <p>执行步骤：
 * <ol>
 *   <li>[步骤1]: [详细说明]</li>
 *   <li>[步骤2]: [详细说明]</li>
 *   <li>[步骤3]: [详细说明]</li>
 * </ol>
 * 
 * <p>业务规则：
 * <ul>
 *   <li>[规则1 - 如：同一用户30分钟内不能重复下单]</li>
 *   <li>[规则2 - 如：升级卡同时只能有1个未完成订单]</li>
 * </ul>
 * 
 * @param xxx [参数业务含义]
 * @return [返回值业务含义，如：订单号]
 * @throws XxxException [异常触发条件]
 */

### 5. DTO/Entity 类注释

/**
 * [类用途 - 如：订单创建请求参数]
 * 
 * <p>使用场景：[在哪些接口/流程中使用]
 * 
 * @author [作者]
 * @since [版本]
 */

### 6. DTO/Entity 字段注释

/**
 * [字段业务含义]
 * 
 * <p>示例值：[如 "ORD20250312001234"]
 * <p>取值范围：[如 "CREATED, ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED"]
 * <p>单位：[如 "秒"、"米"、"分"]
 * <p>约束：[如 "必填"、"最大长度100"]
 */
private String code;

---

## 要求

1. **基于代码理解**：仔细阅读代码逻辑，注释必须准确反映实际业务
2. **业务视角**：用业务语言描述，不要只是翻译代码
3. **说明调用链**：Controller 方法要说明调用了哪些 Service
4. **列出步骤**：复杂方法要按顺序列出执行步骤
5. **标注规则**：重要的业务规则和限制必须标注
6. **字段说明**：DTO 字段要有业务含义、示例值、取值范围

---

## 立即开始

从现在开始扫描项目，找出所有需要添加注释的文件，然后逐个处理。

不要问我任何问题，直接开始工作。如果项目太大，从最重要的 Controller 开始。
```

---

## 💡 使用方法

1. 复制上面的提示词（从 `# 强制任务` 到 `从最重要的 Controller 开始。`）
2. 粘贴给 AI 助手
3. AI 会自动扫描项目并开始添加注释

## 📝 指定目录（可选）

如果想指定处理某些目录，在提示词末尾追加：

```
从以下目录开始处理：
- src/main/java/com/example/controller/
- src/main/java/com/example/service/
- src/main/java/com/example/dto/
```

## 🎯 指定单个文件（可选）

如果只想处理特定文件：

```
只处理这个文件：
src/main/java/com/example/controller/OrderController.java
```
