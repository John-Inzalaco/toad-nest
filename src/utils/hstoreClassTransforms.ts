export const stringToBoolean = ({ value }: { value: string | null }) => {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return value;
};

export const stringToDate = ({ value }: { value: string | null }) => {
  if (!value) {
    return null;
  }
  return new Date(value);
};

export const stringSecondsTimestampToDate = ({
  value,
}: {
  value: string | null;
}) => {
  if (!value) {
    return null;
  }
  return new Date(Number(value) * 1000);
};
