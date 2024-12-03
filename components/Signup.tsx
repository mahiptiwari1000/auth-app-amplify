'use client';

import { withAuthenticator } from '@aws-amplify/ui-react';
import { AuthUser } from 'aws-amplify/auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import '@aws-amplify/ui-react/styles.css';
import Image from 'next/image';

const Signup = ({ user }: { user?: AuthUser }) => {
    const router = useRouter();    

    useEffect(() => {
        console.log(user,"user");
        
        if (user) {
            router.push(`/?user=${user?.userId}`);
        }
    }, [user,router]);

    return null; // The actual content is injected by the authenticator
};

export default withAuthenticator(Signup, {
    formFields: {
        signUp: {
            given_name: {
                label: 'First Name',
                placeholder: 'Enter your first name',
                required: true,
            },
            family_name: {
                label: 'Last Name',
                placeholder: 'Enter your last name',
                required: true,
            },
            'custom:state': {
                label: 'State',
                placeholder: 'State',
                required: true,
            },
            'custom:city': {
                label: 'City',
                placeholder: 'City',
                required: true,
            },
            'custom:street_address': {
                label: 'Address',
                placeholder: 'Address',
                required: true,
            },
            'custom:zipcode': {
                label: 'Zipcode',
                placeholder: 'Zipcode',
                required: true,
            },
            email: {
                label: 'Email',
                placeholder: 'Enter your email',
                required: true,
            },
            phone_number: {
                label: 'Phone Number',
                placeholder: 'Enter your phone number',
                required: true,
            },
            password: {
                label: 'Create Password',
                placeholder: 'Create a password',
                required: true,
            },
            confirm_password: {
                label: 'Re-enter Password',
                placeholder: 'Re-enter your password',
                required: true,
            },
        },
    },
    components: {
        Header: () => (
            <div className="flex flex-col items-center mb-8">
                <Image
                    src="/logo.png"
                    alt="Invictacore Logo"
                    width={100}
                    height={100}
                    className="mb-4 rounded-full shadow-md border border-gray-200"
                />
                <h1 className="text-4xl font-extrabold text-white tracking-tight">
                    Welcome to <span className="text-blue-500">Invictacore</span>
                </h1>
                <p className="text-gray-400 text-base mt-2">
                    Sign in or create an account to get started and unlock your full potential.
                </p>
            </div>
        ),
        Footer: () => (
            <div className="text-center text-sm text-gray-500 mt-4">
                <p>
                    Powered by{' '}
                    <a
                        href="https://aws.amazon.com/amplify/"
                        className="text-blue-600 font-medium hover:underline"
                    >
                        AWS Amplify
                    </a>
                </p>
            </div>
        ),
    },
});
