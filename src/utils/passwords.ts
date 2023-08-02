import * as bcrypt from 'bcrypt';

const defaultRounds: number = process.env.NODE_ENV === 'test' ? 1 : 10;

let _salt: string;
const getSalt = async (rounds: number = defaultRounds): Promise<string> => {
  if (!_salt) {
    _salt = await bcrypt.genSalt(rounds);
  }

  return _salt;
};

export const hash = async (password: string) =>
  bcrypt.hash(password, await getSalt());

export const compare = bcrypt.compare;
