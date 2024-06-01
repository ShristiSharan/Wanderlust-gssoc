import React from 'react';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import navigateBackBlackIcon from '@/assets/svg/navigate-back-black.svg';
import navigateBackWhiteIcon from '@/assets/svg/navigate-back-white.svg';
import ModalComponent from '@/components/modal';
import CategoryPill from '@/components/category-pill';
import { categories } from '@/utils/category-colors';
import userState from '@/utils/user-state';
import axiosInstance from '@/helpers/axios-instance';
import { AxiosError, isAxiosError } from 'axios';

import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

type FormData = {
  title: string;
  authorName: string;
  image: string;
  categories: string[];
  description: string;
  isFeaturedPost: boolean;
};
function AddBlog() {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const navigate = useNavigate();

  const handleImageSelect = (imageUrl: string) => {
    setSelectedImage(imageUrl);
  };
  const [modal, setmodal] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    authorName: '',
    image: '',
    categories: [],
    description: '',
    isFeaturedPost: false,
  });

  const addBlogSchema = z.object({
    title: z.string().min(3, 'Thats it? Give atleast 3 words.'),
    description: z.string().min(10, 'Go on, spill the beans'),
    authorName: z.string().min(2, "C'mon your name cannot be less than 3 characters" ),
    image: z.union([
      z.string().url({ message: 'Image URL must be a valid URL' }),
      z.object({ type: z.literal('image/*').optional() }),]),
    // z.string().url('You Forgot the Image!'),
    // categories: z.array(z.string()).min(1, 'Select at least 1 category').max(3, 'Select up to 3 categories'),

  });

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(addBlogSchema)
  });

  //checks the length of the categories array and if the category is already selected
  const isValidCategory = (category: string): boolean => {
    return formData.categories.length >=3 || !formData.categories.includes(category);
  };

  const handleCategoryClick = (category: string) => {
    console.log("Current categories:", formData.categories);
    if (!isValidCategory(category)) return;

    if (formData.categories.includes(category)) {
      setFormData({
        ...formData,
        categories:formData.categories.concat(category),
      });
    } else {
      setFormData({
        ...formData,
        categories: [...formData.categories, category],
      });
      console.log("Updated formData:", formData.categories);
    }
  };
  useEffect(() => {
    console.log("Updated categories in useEffect:", formData.categories);
  }, []);

  const handleselector = () => {
    setFormData({
      ...formData,
      image: selectedImage,
    });
    setmodal(false);
  };
  const handleCheckboxChange = () => {
    setFormData({ ...formData, isFeaturedPost: !formData.isFeaturedPost });
  };
  
  const validateFormData = (data: FormData) => {
    console.log(data.categories.length)
    if (
      !data.title ||
      !data.authorName ||
      !data.image ||
      !data.description ||
      data.categories.length < 1 ||
      data.categories.length > 3
    ) {
      toast.error('All fields must be filled out.');
      return false;
    }
    const imageLinkRegex = /\.(jpg|jpeg|png|webp)$/i;
    if (!imageLinkRegex.test(data.image)) {
      toast.error('Image URL must end with .jpg, .jpeg, .webp or .png');
      return false;
    }
    if (formData.categories.length > 3) {
      toast.error('Select up to three categories.');
      return false;
    }

    return true;
  };

  const onSubmit = async (data: FormData) => {
    if (validateFormData(data)) {
      console.log("Submitted data:", data)
      try {
        const postPromise = axiosInstance.post('/api/posts/', formData);
        toast.promise(postPromise, {
          pending: 'Creating blog post...',
          success: {
            render() {
              setFormData({
                title: '',
                authorName: '',
                image: '',
                categories: [],
                description: '',
                isFeaturedPost: false,
              });
              navigate('/');
              return 'Blog created successfully';
            },
          },
          error: {
            render({ data }) {
              if (data instanceof AxiosError) {
                if (data?.response?.data?.message) {
                  return data?.response?.data?.message;
                }
              }
              return 'Blog creation failed';
            },
          },
        });

        return (await postPromise).data;
      } catch (error: unknown) {
        if (isAxiosError(error)) {
          navigate('/');
          userState.removeUser();
          console.error(error.response?.data?.message);
        } else {
          console.error(error);
        }
      }
    }
  };
  const [isDarkMode, setIsDarkMode] = useState<boolean | null>(null);
  useEffect(() => {
    const storedTheme = localStorage.getItem('theme');
    setIsDarkMode(storedTheme === 'dark');
  }, []);

  function Asterisk() {
    return <span className="dark:text-dark-tertiary">*</span>;
  }
  return (
    <div className="flex-grow cursor-default bg-slate-50 px-6 py-8 dark:bg-dark-card">
      <div className="mb-4 flex justify-center">
        <div className="flex w-[32rem] items-center justify-start space-x-4 sm:w-5/6 lg:w-4/6 ">
          <div className="w-fit cursor-pointer">
            <img
              alt="theme"
              src={isDarkMode ? navigateBackWhiteIcon : navigateBackBlackIcon}
              onClick={() => navigate(-1)}
              className="active:scale-click h-5 w-10"
            />
          </div>
          <h2 className="cursor-text text-lg font-semibold text-light-primary dark:text-dark-primary sm:text-xl lg:text-2xl">
            Create Blog
          </h2>
        </div>
      </div>
      <div className="flex justify-center">
        <form onSubmit={handleSubmit(onSubmit, (e)=> console.log(e))} className="sm:w-5/6 lg:w-2/3">
          <div className="mb-2 flex items-center">
            <label className="flex items-center">
              <span className="px-2 text-base font-medium text-light-secondary dark:text-dark-secondary">
                Is this a featured blog?
              </span>
              <input
                type="checkbox"
                name="isFeaturedPost"
                className="ml-2 h-5 w-5 cursor-pointer rounded-full accent-purple-400"
                checked={formData.isFeaturedPost}
                onChange={handleCheckboxChange}
              />
            </label>
          </div>

          <div className="mb-2">
            <div className="px-2 py-1 font-medium text-light-secondary dark:text-dark-secondary">
            <label htmlFor="title" title="must be longer than 3">
              Blog Title <Asterisk />
            </label>
            <input
              id="text"
              type="text"
              placeholder="Travel Bucket List for this Year"
              autoComplete="off"
              className="dark:text-textInField w-full rounded-lg bg-slate-200 p-3 placeholder:text-sm placeholder:text-light-tertiary dark:bg-dark-field dark:text-slate-50 dark:placeholder:text-dark-tertiary"
              {...register("title")}
              />
              {errors.title?.message && <p className="text-red-500">{errors.title?.message}</p>}
          </div>
          </div>
          
          <div className="mb-1">
            <div className="px-2 py-1 font-medium text-light-secondary dark:text-dark-secondary">
            <label htmlFor="concent" title="Description should be clear and longer than 10 characters">
              Blog content <Asterisk />
            </label>
            </div>
            <textarea
              placeholder="Start writing here&hellip;"
              rows={5}
              className="dark:text-textInField w-full rounded-lg bg-slate-200 p-3 placeholder:text-sm placeholder:text-light-tertiary dark:bg-dark-field dark:placeholder:text-dark-tertiary"
              {...register('description')}
            />
            {errors.description?.message && (
              <p className="text-red-500">{errors.description?.message}</p>
              )}
          </div>

          <div className="mb-2">
            <div className="px-2 py-1 font-medium text-light-secondary dark:text-dark-secondary">
              Author name <Asterisk />
            </div>
            <input
              type="text"
              placeholder="Shree Sharma"
              className="dark:text-textInField w-full rounded-lg bg-slate-200 p-3 placeholder:text-sm placeholder:text-light-tertiary dark:bg-dark-field dark:placeholder:text-dark-tertiary"
              {...register('authorName')}
            />
            {errors?.authorName && <p className="text-red-500">{errors.authorName.message}</p>}
          </div>

        <div className="mb-2">
          <div className="px-2 py-1 font-medium text-light-secondary dark:text-dark-secondary">
            Blog cover image
            <span className="text-xs tracking-wide text-dark-tertiary">
              &nbsp;(jpg/png/webp)&nbsp;
            </span>
            <Asterisk />
          </div>
          <div className="mb-4 flex justify-between gap-2 sm:gap-4">
            <input
              type="url"
              id="imagelink"
              placeholder="https://&hellip;"
              autoComplete="off"
              accept="image/*"
              className="dark:text-textInField w-3/4 rounded-lg bg-slate-200 p-3 placeholder:text-sm placeholder:text-light-tertiary dark:bg-dark-field dark:placeholder:text-dark-tertiary lg:w-10/12"
              value={formData.image}
              {...register('image')}
            />            
            <button
              name="openModal"
              type="button"
              className="lg:text-md active:scale-click w-1/4 rounded-lg bg-light-primary text-xs text-slate-50 hover:bg-light-primary/80 dark:bg-dark-primary dark:text-dark-card dark:hover:bg-dark-secondary/80 sm:text-sm lg:w-2/12 lg:px-4 lg:py-3"
              onClick={() => {
                setmodal(true);
              }}
            >
              Pick image
            </button>
            {errors.image && <p className="text-red-500">{errors.image.message}</p>}
          </div>
          </div>
          <div className="mb-4 flex flex-col">
            <label className="px-2 pb-1 font-medium text-light-secondary dark:text-dark-secondary sm:mr-4 sm:w-fit">
              Categories
              <span className="text-xs tracking-wide text-dark-tertiary">
                &nbsp;(max 3 categories)&nbsp;
              </span>
              <Asterisk />
            </label>
            <div className="flex flex-wrap gap-3 rounded-lg p-2 dark:bg-dark-card dark:p-3">      
              {categories.map((category, index) => (
                <span key={`${category}-${index}`} onClick={() => handleCategoryClick(category)}>
                  <CategoryPill
                    category={category}
                    selected={formData.categories.includes(category)}
                    disabled={!isValidCategory(category)}
                  />
                </span>
              ))}
            </div>
            </div>

          <button
            name="post-blog"
            type="submit"
            className="active:scale-click flex w-full items-center justify-center rounded-lg bg-light-primary px-12 py-3 text-base font-semibold text-light hover:bg-light-primary/80 dark:bg-dark-primary dark:text-dark-card dark:hover:bg-dark-secondary/80 sm:mx-1 sm:w-fit"
          >
            Post blog
          </button>
        </form>
        <ModalComponent
          selectedImage={selectedImage}
          handleImageSelect={handleImageSelect}
          handleSelector={handleselector}
          setModal={setmodal}
          modal={modal}
        />
      </div>
    </div>
  );
}

export default AddBlog;







