# Java 代码注释规范

> 本规则定义了 Java 代码的注释标准，所有 Controller、Service、DTO 类必须遵循此规范

---

## 强制要求

在编写 Java 代码时，**必须**为以下内容添加 JavaDoc 注释：
- 所有 Controller 类和公开方法
- 所有 Service 类和公开方法
- 所有 DTO/Entity/VO 类和字段
- 所有枚举类和枚举值

---

## Controller 注释规范

### 类注释

```java
/**
 * [业务功能概述 - 一句话说明这个 Controller 负责什么业务]
 *
 * <p>服务场景：
 * <ul>
 *   <li>[用户群体1] - [使用场景描述]</li>
 *   <li>[用户群体2] - [使用场景描述]</li>
 * </ul>
 *
 * <p>核心功能：
 * <ul>
 *   <li>[功能1]: [简要说明]</li>
 *   <li>[功能2]: [简要说明]</li>
 * </ul>
 *
 * @author [作者]
 * @since [版本号]
 */
@RestController
@RequestMapping("/api/xxx")
public class XxxController {
```

### 方法注释

```java
/**
 * [接口用途 - 一句话说明这个接口做什么]
 *
 * <p>业务逻辑：
 * <ol>
 *   <li>校验请求参数</li>
 *   <li>调用 {@link XxxService#methodName} 处理业务</li>
 *   <li>组装并返回结果</li>
 * </ol>
 *
 * <p>注意事项：
 * <ul>
 *   <li>[重要的业务规则]</li>
 *   <li>[特殊限制条件]</li>
 * </ul>
 *
 * @param req [参数的业务含义]
 * @return [返回值的业务含义]
 */
@PostMapping("/create")
public Result<String> create(@RequestBody CreateReq req) {
```

---

## Service 注释规范

### 类注释

```java
/**
 * [服务功能概述 - 一句话说明这个 Service 的核心职责]
 *
 * <p>职责范围：
 * <ul>
 *   <li>[职责1]: [具体说明]</li>
 *   <li>[职责2]: [具体说明]</li>
 * </ul>
 *
 * <p>核心依赖：
 * <ul>
 *   <li>{@link XxxRepository} - 数据持久化</li>
 *   <li>{@link YyyService} - [依赖原因]</li>
 * </ul>
 *
 * @author [作者]
 * @since [版本号]
 */
@Service
public class XxxServiceImpl implements XxxService {
```

### 方法注释

```java
/**
 * [方法业务目的 - 一句话说明这个方法做什么]
 *
 * <p>执行步骤：
 * <ol>
 *   <li>[步骤1]: [详细说明做了什么]</li>
 *   <li>[步骤2]: [详细说明做了什么]</li>
 *   <li>[步骤3]: [详细说明做了什么]</li>
 * </ol>
 *
 * <p>业务规则：
 * <ul>
 *   <li>[规则1]: [如"同一用户30分钟内不能重复下单"]</li>
 *   <li>[规则2]: [如"升级卡同时只能有1个未完成订单"]</li>
 * </ul>
 *
 * @param param1 [参数1的业务含义]
 * @param param2 [参数2的业务含义]
 * @return [返回值的业务含义，如"订单号"]
 * @throws BusinessException 当[触发条件]时抛出
 */
@Override
public String createOrder(CreateReq req) {
```

---

## DTO/Entity/VO 注释规范

### 类注释

```java
/**
 * [类用途 - 如"订单创建请求参数"、"用户信息响应体"]
 *
 * <p>使用场景：[在哪些接口/流程中使用，如"用于 POST /api/order/create 接口"]
 *
 * @author [作者]
 * @since [版本号]
 */
@Data
public class OrderCreateReq {
```

### 字段注释

```java
/**
 * [字段业务含义 - 用业务语言描述这个字段代表什么]
 *
 * <p>示例值：[给出1-2个实际的示例值]
 * <p>取值范围：[如果是枚举或有限范围，列出可选值]
 * <p>单位：[如果有单位，必须标注，如"秒"、"米"、"分"]
 * <p>约束：[如"必填"、"最大长度100"、"不能为负数"]
 */
private String fieldName;
```

### 字段注释示例

```java
/**
 * 订单唯一编号
 *
 * <p>示例值："ORD20250312001234"
 * <p>约束：必填，系统自动生成
 */
private String orderCode;

/**
 * 订单状态
 *
 * <p>取值范围：CREATED(已创建), ASSIGNED(已分配), IN_PROGRESS(进行中), 
 *            COMPLETED(已完成), CANCELLED(已取消)
 * @see OrderStatusEnum
 */
private String status;

/**
 * 预计行程时长
 *
 * <p>单位：秒
 * <p>示例值：1800 表示 30 分钟
 * <p>约束：必须大于0
 */
private Long estimatedTripDuration;

/**
 * 订单金额
 *
 * <p>单位：分（人民币）
 * <p>示例值：10000 表示 100.00 元
 * <p>约束：必须大于等于0
 */
private Long amount;
```

---

## 枚举注释规范

```java
/**
 * 订单状态枚举
 *
 * <p>定义订单从创建到完成的完整生命周期状态
 *
 * @author [作者]
 * @since [版本号]
 */
public enum OrderStatusEnum {

    /**
     * 已创建 - 订单刚创建，等待分配司机
     * <p>可执行操作：取消、改约
     */
    CREATED("created", "已创建"),

    /**
     * 已分配 - 已分配司机，等待司机出发
     * <p>可执行操作：取消
     */
    ASSIGNED("assigned", "已分配"),

    /**
     * 进行中 - 司机已接到乘客，行程进行中
     * <p>可执行操作：无（需等待完成）
     */
    IN_PROGRESS("in_progress", "进行中"),

    /**
     * 已完成 - 行程结束
     * <p>终态，不可变更
     */
    COMPLETED("completed", "已完成"),

    /**
     * 已取消 - 订单被取消
     * <p>终态，不可变更
     */
    CANCELLED("cancelled", "已取消");
}
```

---

## 注释质量要求

### ✅ 必须做到

1. **业务视角**：用业务语言描述，不要只是翻译代码变量名
2. **说明调用链**：Controller 方法要用 `{@link}` 说明调用了哪些 Service
3. **列出步骤**：复杂方法按执行顺序列出步骤
4. **标注规则**：重要的业务规则必须标注
5. **给出示例**：字段注释要给出实际的示例值
6. **标注单位**：涉及数值的字段必须标注单位

### ❌ 禁止行为

1. **禁止无意义注释**：如 `/** 获取名称 */ getName()` 这种只是重复方法名的注释
2. **禁止空注释**：不要留空的 `/** */`
3. **禁止过时注释**：修改代码时必须同步更新注释
4. **禁止只写英文**：核心业务注释使用中文，便于团队理解

---

## 简化规则（非核心代码）

以下代码可以使用简化注释：

- **工具类方法**：一句话说明即可
- **Getter/Setter**：可以不写（使用 Lombok）
- **私有方法**：一句话说明即可
- **测试代码**：可以简化

```java
/**
 * 将日期格式化为 yyyy-MM-dd HH:mm:ss
 */
public static String formatDateTime(Date date) {
```

---

## 检查清单

在提交代码前，确认以下内容：

- [ ] 所有 Controller 类有业务功能概述
- [ ] 所有 Controller 公开方法有业务逻辑说明
- [ ] 所有 Service 类有职责说明
- [ ] 所有 Service 公开方法有执行步骤和业务规则
- [ ] 所有 DTO 类有使用场景说明
- [ ] 重要字段有业务含义、示例值、单位（如适用）
- [ ] 枚举值有含义和可执行操作说明
