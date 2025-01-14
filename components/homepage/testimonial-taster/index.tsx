import React from 'react';
import styled from 'styled-components';
import { media } from '../../../utilities/media';

import AllTestimonials from './testimonial-data';
import Testimonial from './testimonial-template';
import Highlight from '../../shared/highlight';
import Link from 'next/link';

const StyledTestimonial = styled(Testimonial)`
  font-size: 2rem;
  margin-right: 3rem;
`;

const FlexContainer = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
  margin-bottom: 5rem;
`;

const BorderBox = styled.div`
  border: 0.5rem solid #902e2d;
  padding: 3rem 3rem 1rem;
  width: 75vw;
  margin-top: 6.5rem;
`;

const RedHeader = styled.div`
  border: 2rem solid #fff;
  width: 56vw;
  margin: -8.6rem auto -1rem auto;
  padding: 0.2rem 2rem 0.8rem;
  text-align: center;
  background-color: #902e2d;
  color: white;
  font-size: 6.5rem;
  font-family: 'Dancing Script', cursive;
  -webkit-backface-visibility: hidden;

  ${media.tablet`
    font-size: 4.3rem;`}

  ${media.phone`
    font-size: 4rem;`};
`;
const ThreeTestimonials = styled.div`
  display: flex;
  ${media.tablet`
    flex-direction: column;`}

  ${media.phone`
    flex-direction: column;`};
`;
const LearnMore = styled.div`
  font-style: italic;
  text-align: center;
`;

const TestimonialTaster = () => (
  <FlexContainer>
    <BorderBox>
      <RedHeader>What they are saying</RedHeader>
      <ThreeTestimonials>
        {AllTestimonials.map((testimonial, i) => (
          <StyledTestimonial {...testimonial} key={i} />
        ))}
      </ThreeTestimonials>
      r/index.jsx
    </BorderBox>
    <LearnMore>
      See even more reviews on{' '}
      <a target="_blank" href="https://www.yelp.com/biz/the-meatball-stoppe-orlando-2" rel="noopener noreferrer">
        <Highlight>Yelp (★★★★½ stars)</Highlight>
      </a>{' '}
      or our{' '}
      <Link href="/media">
        <Highlight>Media page</Highlight>
      </Link>
    </LearnMore>
  </FlexContainer>
);

export default TestimonialTaster;
