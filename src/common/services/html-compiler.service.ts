import { Service } from 'typedi';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';
import envConf from '@/config/env.conf';

@Service()
export class HtmlCompilerService {
  compile<T = unknown>(templatePath: string, data: T): string {
    // Load the HTML template from the file system

    const fullPath = path.resolve(envConf.rootDir, 'src', templatePath);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Template file not found: ${fullPath}`);
    }

    // Read the HTML file
    const html = fs.readFileSync(fullPath, 'utf-8');

    // Compile the HTML with the provided data using handlebars
    const template = Handlebars.compile(html);
    return template(data);
  }

  compileFromString<T = unknown>(htmlString: string, data: T): string {
    // Compile the HTML with the provided data using handlebars
    const templateFunc = Handlebars.compile(htmlString);
    return templateFunc(data);
  }
}
