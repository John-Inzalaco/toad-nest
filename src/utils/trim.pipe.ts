import { PipeTransform } from '@nestjs/common';

type Primitive = object | string | number | [] | boolean | null | undefined;

export class TrimPipe implements PipeTransform {
  transform(value: Primitive) {
    const replacer = (key: string | number | symbol, value: Primitive) => {
      if (typeof value === 'string') {
        return value.trim();
      }
      return value;
    };

    const trimmedObj = JSON.parse(JSON.stringify(value, replacer));

    return trimmedObj;
  }
}
