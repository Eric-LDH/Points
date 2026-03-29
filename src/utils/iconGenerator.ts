// 图标库（预定义 40+ 个常用图标）
const ICON_LIBRARY: Record<string, string[]> = {
  家务: ['🧹', '🧺', '🍽️', '🧼', '🧽', '🧴', '🧻', '🧤'],
  生活习惯: ['😊', '💪', '🏃', '🚿', '😴', '🍎', '🥗', '🚴'],
  学习习惯: ['📚', '✏️', '📖', '🎒', '📝', '🔍', '💡', '⭐'],
  加分项: ['🌟', '🏆', '🎉', '🎨', '🎵', '🎯', '🎪', '🤹'],
  惩罚: ['⏰', '📱', '😤', '⚠️', '❌', '😠', '🔇', '🚫']
}

export const IconGenerator = {
  /**
   * 生成随机图标
   * @param category 分类
   * @returns 随机图标 emoji
   */
  generate(category: string): string {
    const categoryIcons = ICON_LIBRARY[category] || ICON_LIBRARY['生活习惯']
    return categoryIcons[Math.floor(Math.random() * categoryIcons.length)]
  },

  /**
   * 批量生成图标
   * @param rules 规则数组
   * @returns 图标数组
   */
  batchGenerate(rules: Array<{ category: string }>): string[] {
    return rules.map(rule => this.generate(rule.category))
  },

  /**
   * 获取所有可用图标
   */
  getAllIcons(): string[] {
    return Object.values(ICON_LIBRARY).flat()
  }
}
