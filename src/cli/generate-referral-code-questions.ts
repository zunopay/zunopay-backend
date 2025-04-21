import { QuestionSet, Question } from 'nest-commander';

@QuestionSet({ name: 'generate-referral-code' })
export class GenerateReferralCodeQuestions {
  @Question({
    type: 'input',
    name: 'numberOfCodes',
    default: 1,
    message: 'How many referral codes you want to generate ?',
    validate: function (value: string) {
      if (!value) {
        return false;
      }
      return true;
    },
  })
  parseNumberOfCodes(value: string): number {
    return +value;
  }

  @Question({
    type: 'input',
    name: 'username',
    message:
      'Username of the user you want to generate referral codes for (empty if add in every user)',
  })
  parseUsername(value: string): string {
    return value;
  }
}
