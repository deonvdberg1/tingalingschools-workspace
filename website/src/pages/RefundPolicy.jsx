import React from 'react';
import PolicyDoc, { PolicyHeading, PolicyLink } from '@/components/PolicyDoc';

export default function RefundPolicy() {
  return (
    <PolicyDoc title="Refund and Cancellation Policy">
      <p>
        This policy explains when fees may be refunded or cancelled at Ting-A-Ling Schools
        (Pre-Primary School and Special Needs School) in Meerensee, Richards Bay. It should be read
        together with our <PolicyLink to="/terms">Terms and Conditions</PolicyLink> and the
        enrolment terms you sign when you enrol your child.
      </p>

      <PolicyHeading>1. Enrolment fees are not refundable</PolicyHeading>
      <p>
        <strong>Once-off enrolment or registration fees are non-refundable.</strong> This applies
        whether you withdraw the application, decline a place, or later withdraw the child from the
        school. The enrolment fee is charged to secure and process a place and is not a deposit
        against monthly school fees.
      </p>

      <PolicyHeading>2. Withdrawal by a parent or guardian</PolicyHeading>
      <p>
        If you wish to withdraw a learner from the school, you must give <strong>one full calendar
        month's written notice</strong> to the school office, sent to{' '}
        <a href="mailto:info@tingalingschools.com" className="text-teal-700 font-medium hover:underline">
          info@tingalingschools.com
        </a>{' '}
        or delivered to the relevant campus. Fees remain payable during the notice period.
      </p>
      <p>
        If you do not give one full calendar month's written notice, <strong>one month's school fees
        are payable in lieu of notice</strong>. The school may recover this amount in the ordinary
        way, including from any prepaid fees.
      </p>
      <p>
        Written notice should include the child's full name, the campus, and the last intended date
        of attendance.
      </p>

      <PolicyHeading>3. Absence, illness and holidays</PolicyHeading>
      <p>
        There are no refunds or reductions of school fees for a child's absence, including absence
        due to illness, family travel, public holidays, or school holidays. Fees are charged to
        reserve the child's place in the programme, not only for the days the child attends.
      </p>

      <PolicyHeading>4. Overpayments and duplicate online payments</PolicyHeading>
      <p>
        If you accidentally pay twice, pay the wrong amount, or otherwise overpay — including a
        duplicate payment made online through PayFast — you may request a refund of the overpaid
        amount.
      </p>
      <p>Please email info@tingalingschools.com with:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>the child's full name and campus;</li>
        <li>the date and amount of the payment;</li>
        <li>the PayFast or bank payment reference; and</li>
        <li>proof of payment, if you have it.</li>
      </ul>
      <p>
        Once the school has confirmed that an overpayment or duplicate payment was received, the
        refund will be paid back to the original payment method where this is reasonably possible
        (for example, back to the card or account used on PayFast, or by electronic transfer to the
        account that made an EFT payment).
      </p>
      <p>
        The school aims to process approved refunds within 10 business days of confirming the
        overpayment. The time it then takes for the funds to reach you depends on PayFast and your
        bank, and may be a few further business days.
      </p>
      <p>
        This section applies only to genuine overpayments or duplicate payments. It does not change
        the rule that enrolment and registration fees are non-refundable, or the notice requirements
        for withdrawal.
      </p>

      <PolicyHeading>5. Cancellation by the school</PolicyHeading>
      <p>The school may cancel a child's enrolment, after written notice, if:</p>
      <ul className="list-disc pl-6 space-y-2">
        <li>school fees or other amounts due remain unpaid after reasonable notice;</li>
        <li>there is a serious or repeated breach of the school's terms, rules or policies;</li>
        <li>the school cannot reasonably meet the child's needs; or</li>
        <li>another lawful and fair reason exists, including where required for the safety or wellbeing of the child or of others at the school.</li>
      </ul>
      <p>
        Enrolment and registration fees remain non-refundable if the school cancels the enrolment.
        If you have prepaid monthly school fees for a period after the cancellation takes effect,
        the unused portion of those prepaid monthly fees will be refunded, less any amount still
        owing to the school (including fees in lieu of notice, where applicable).
      </p>

      <PolicyHeading>6. How to contact us about a refund or cancellation</PolicyHeading>
      <p>
        Please send withdrawal notices and refund requests in writing to{' '}
        <a href="mailto:info@tingalingschools.com" className="text-teal-700 font-medium hover:underline">
          info@tingalingschools.com
        </a>
        , or deliver them to the school office at the relevant campus. You may also phone the office
        on 061 527 4429 or 072 456 1281, but a written notice is still required for withdrawal.
      </p>
    </PolicyDoc>
  );
}
