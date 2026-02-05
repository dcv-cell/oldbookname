class LogService {
  constructor() {
    this.logs = [];
    this.maxLogs = 1000; // 最大日志数量，防止内存占用过多
  }

  /**
   * 记录日志
   * @param {string} level - 日志级别: info, warn, error, debug
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  log(level, message, data = {}) {
    const logEntry = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };

    this.logs.push(logEntry);
    
    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 在控制台输出日志
    switch (level) {
      case 'error':
        console.error(`[ERROR] ${message}`, data);
        break;
      case 'warn':
        console.warn(`[WARN] ${message}`, data);
        break;
      case 'debug':
        console.debug(`[DEBUG] ${message}`, data);
        break;
      default:
        console.log(`[INFO] ${message}`, data);
    }
  }

  /**
   * 记录信息日志
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }

  /**
   * 记录警告日志
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }

  /**
   * 记录错误日志
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  error(message, data = {}) {
    this.log('error', message, data);
  }

  /**
   * 记录调试日志
   * @param {string} message - 日志消息
   * @param {object} data - 附加数据
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }

  /**
   * 获取所有日志
   * @returns {array} 日志数组
   */
  getLogs() {
    return [...this.logs];
  }

  /**
   * 按级别获取日志
   * @param {string} level - 日志级别
   * @returns {array} 日志数组
   */
  getLogsByLevel(level) {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
    this.info('Logs cleared');
  }

  /**
   * 导出日志为JSON
   * @returns {string} JSON格式的日志
   */
  exportLogs() {
    return JSON.stringify(this.logs, null, 2);
  }
}

export default new LogService();