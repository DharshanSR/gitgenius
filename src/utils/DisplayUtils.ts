import chalk from 'chalk';

export class DisplayUtils {
  static success(message: string, withIcon: boolean = false): void {
    const icon = withIcon ? '✨ ' : '';
    console.log(chalk.green(`${icon}[SUCCESS] ${message}`));
  }

  static error(message: string): void {
    console.log(chalk.red(`[ERROR] ${message}`));
  }

  static warning(message: string): void {
    console.log(chalk.yellow(`[WARNING] ${message}`));
  }

  static info(message: string): void {
    console.log(chalk.blue(`[INFO] ${message}`));
  }

  static log(category: string, message: string): void {
    console.log(chalk.blue(`[${category.toUpperCase()}] ${message}`));
  }

  static highlight(message: string): void {
    console.log(chalk.white(message));
  }

  static dim(message: string): void {
    console.log(chalk.gray(message));
  }

  static accent(message: string): void {
    console.log(chalk.yellow(message));
  }

  static cyan(message: string): void {
    console.log(chalk.cyan(message));
  }

  static green(message: string): void {
    console.log(chalk.green(message));
  }

  static formatList(items: string[], indent: string = '        '): void {
    items.forEach(item => console.log(`${indent}${item}`));
  }

  static separator(): void {
    console.log('');
  }
}
