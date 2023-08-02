import { hashInvitationToken, generateKey } from '../src/site-users/helpers';

describe('generateKey', () => {
  it('returns expected key for a given salt', async () => {
    const key = await generateKey('Devise invitation_token');
    expect(key.toString('hex')).toMatchInlineSnapshot(
      `"915bbbb3abc30d2725c189c94b7478b2578d50947650ce0760290b4443b1ad4a85ca6efc509c03380f9c23c82f5529cc10f9e95d83ee552ba032aa5bf2e88c1c"`,
    );
  });
});

describe('hashInvitationToken', () => {
  it('returns expected hash for a given token', async () => {
    const hash = await hashInvitationToken('FjbZ-M-Zh4hjVRr2x-4F');
    expect(hash).toEqual(
      '97f58d445709dd2d14208e5b0765c86f58f729ece016853059b3b883437797ab',
    );
  });
});
