export function validateName(value) {
  if (!value || !value.trim()) return '请输入姓名';
  if (value.trim().length < 2) return '姓名至少需要 2 个字';
  if (value.trim().length > 50) return '姓名不能超过 50 个字';
  return '';
}

export function validateEmail(value) {
  if (!value || !value.trim()) return '请输入邮箱';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return '邮箱格式不正确';
  return '';
}

export function validateSubject(value) {
  if (!value || !value.trim()) return '请输入主题';
  if (value.trim().length < 2) return '主题至少需要 2 个字';
  return '';
}

export function validateMessage(value) {
  if (!value || !value.trim()) return '请输入留言内容';
  if (value.trim().length < 10) return '留言内容至少需要 10 个字';
  if (value.trim().length > 1000) return '留言内容不能超过 1000 个字';
  return '';
}

export function validateForm({ name, email, subject, message }) {
  return {
    name: validateName(name),
    email: validateEmail(email),
    subject: validateSubject(subject),
    message: validateMessage(message),
  };
}
