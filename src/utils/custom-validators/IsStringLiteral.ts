import { ValidationOptions, ValidateBy, buildMessage } from 'class-validator';

export function IsStringLiteral(
  possibleValues: string[],
  validationOptions?: ValidationOptions,
) {
  return ValidateBy(
    {
      name: 'isStringLiteral',
      constraints: [possibleValues],
      validator: {
        validate: (value, args): boolean =>
          Boolean(args?.constraints[0]?.includes(value)),
        defaultMessage: buildMessage(
          (eachPrefix) =>
            `${eachPrefix}$property must be one of the following values: $constraint1`,
          validationOptions,
        ),
      },
    },
    validationOptions,
  );
}
