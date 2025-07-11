import React, { useState, useRef } from 'react'
import { FaCloudUploadAlt } from "react-icons/fa";
import uploadImage from '../utils/UploadImage';
import Loading from '../components/Loading';
import ViewImage from '../components/ViewImage';
import { MdDelete } from "react-icons/md";
import { useSelector } from 'react-redux';
import { IoClose } from "react-icons/io5";
import AddFieldComponent from '../components/AddFieldComponent';
import Axios from '../utils/Axios';
import SummaryApi from '../common/SummaryApi';
import AxiosToastError from '../utils/AxiosToastError';
import successAlert from '../utils/SuccessAlert';

const UploadProduct = () => {
  const [data, setData] = useState({
    name: "",
    image: [],
    category: [],
    subCategory: [],
    unit: "",
    stock: "",
    price: "",
    discount: "",
    description: "",
    more_details: {},
    seller: "",
    sellerRating: 4.5,
    sellerRatingCount: 1,
  });

  const [imageLoading, setImageLoading] = useState(false);
  const [ViewImageURL, setViewImageURL] = useState("");
  const allCategory = useSelector(state => state.product.allCategory);
  const [selectCategory, setSelectCategory] = useState("");
  const [selectSubCategory, setSelectSubCategory] = useState("");
  const allSubCategory = useSelector(state => state.product.allSubCategory);
  const [openAddField, setOpenAddField] = useState(false);
  const [fieldName, setFieldName] = useState("");
  const [options, setOptions] = useState([]);
  const [optionName, setOptionName] = useState('');
  const [optionValue, setOptionValue] = useState('');
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(null);

  const keyInputRef = useRef();
  const valueInputRef = useRef();
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({ ...prev, [name]: value }));
  };

  const handleUploadImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageLoading(true);
    try {
      const response = await uploadImage(file);
      const { data: ImageResponse } = response;
      const imageUrl = ImageResponse?.data?.url;

      if (!imageUrl) {
        AxiosToastError("Image upload failed");
        return;
      }

      setData(prev => ({
        ...prev,
        image: [...prev.image, imageUrl],
      }));
    } catch (err) {
      AxiosToastError("Image upload failed");
    } finally {
      setImageLoading(false);
    }
  };

  const handleDeleteImage = (index) => {
    const newImages = [...data.image];
    newImages.splice(index, 1);
    setData(prev => ({ ...prev, image: newImages }));
  };

  const handleRemoveCategory = (index) => {
    const newCategories = [...data.category];
    newCategories.splice(index, 1);
    setData(prev => ({ ...prev, category: newCategories }));
  };

  const handleRemoveSubCategory = (index) => {
    const newSubCategories = [...data.subCategory];
    newSubCategories.splice(index, 1);
    setData(prev => ({ ...prev, subCategory: newSubCategories }));
  };

  const handleAddField = () => {
    setData(prev => ({
      ...prev,
      more_details: {
        ...prev.more_details,
        [fieldName]: ""
      }
    }));
    setFieldName("");
    setOpenAddField(false);
  };

  // Add option name
  const handleAddOption = () => {
    if (!optionName.trim()) return;
    setOptions([...options, { name: optionName.trim(), values: [] }]);
    setOptionName('');
  };
  // Add value to selected option
  const handleAddOptionValue = () => {
    if (selectedOptionIdx === null || !optionValue.trim()) return;
    setOptions(opts => opts.map((opt, idx) => idx === selectedOptionIdx ? { ...opt, values: [...opt.values, optionValue.trim()] } : opt));
    setOptionValue('');
  };
  // Remove option
  const handleRemoveOption = idx => setOptions(opts => opts.filter((_, i) => i !== idx));
  // Remove value from option
  const handleRemoveOptionValue = (optIdx, valIdx) => setOptions(opts => opts.map((opt, i) => i === optIdx ? { ...opt, values: opt.values.filter((_, vi) => vi !== valIdx) } : opt));

  const handleAddSpecification = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setData(prev => ({
      ...prev,
      more_details: {
        ...prev.more_details,
        [specKey.trim()]: specValue.trim()
      }
    }));
    setSpecKey('');
    setSpecValue('');
    setTimeout(() => keyInputRef.current && keyInputRef.current.focus(), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("data", data);

    try {
      const submitData = { ...data, options };
      const response = await Axios({
        ...SummaryApi.createProduct,
        data: submitData
      });
      const { data: responseData } = response;

      if (responseData.success) {
        successAlert(responseData.message);
        setData({
          name: "",
          image: [],
          category: [],
          subCategory: [],
          unit: "",
          stock: "",
          price: "",
          discount: "",
          description: "",
          more_details: {},
          seller: "",
          sellerRating: 4.5,
          sellerRatingCount: 1,
        });
        setOptions([]);
      }
    } catch (error) {
      AxiosToastError(error);
    }
  };

  return (
    <section className=''>
      <div className='p-2 bg-white shadow-md flex items-center justify-between'>
        <h2 className='font-semibold'>Upload Product</h2>
      </div>

      <div className='grid p-3'>
        <form className='grid gap-4' onSubmit={handleSubmit}>

          {/* Name */}
          <div className='grid gap-1'>
            <label htmlFor='name' className='font-medium'>Name</label>
            <input
              id='name'
              type='text'
              placeholder='Enter product name'
              name='name'
              value={data.name}
              onChange={handleChange}
              required
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Description */}
          <div className='grid gap-1'>
            <label htmlFor='description' className='font-medium'>Description</label>
            <textarea
              id='description'
              placeholder='Enter product description'
              name='description'
              value={data.description}
              onChange={handleChange}
              required
              rows={3}
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded resize-none'
            />
          </div>

          {/* Image Upload */}
          <div>
            <p className='font-medium'>Image</p>
            <label htmlFor='productImage' className='bg-blue-50 h-24 border rounded flex justify-center items-center cursor-pointer'>
              <div className='text-center flex justify-center items-center flex-col'>
                {imageLoading ? <Loading /> : (<><FaCloudUploadAlt size={35} /><p>Upload Image</p></>)}
              </div>
              <input
                type='file'
                id='productImage'
                className='hidden'
                accept='image/*'
                onChange={handleUploadImage}
              />
            </label>
            <div className='flex flex-wrap gap-4'>
              {data.image.map((img, index) => (
                <div key={img + index} className='h-20 mt-1 w-20 min-w-20 bg-blue-50 border relative group'>
                  <img
                    src={img}
                    alt={img}
                    className='w-full h-full object-scale-down cursor-pointer'
                    onClick={() => setViewImageURL(img)}
                  />
                  <div onClick={() => handleDeleteImage(index)} className='absolute bottom-0 right-0 p-1 bg-red-600 hover:bg-red-600 rounded text-white hidden group-hover:block cursor-pointer'>
                    <MdDelete />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className='grid gap-1'>
            <label className='font-medium'>Category</label>
            <select
              className='bg-blue-50 border w-full p-2 rounded'
              value={selectCategory}
              onChange={(e) => {
                const value = e.target.value;
                const category = allCategory.find(el => el._id === value);
                if (!category || data.category.some(cat => cat._id === category._id)) return;
                setData(prev => ({ ...prev, category: [...prev.category, category] }));
                setSelectCategory("");
              }}
            >
              <option value={""}>Select Category</option>
              {allCategory.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <div className='flex flex-wrap gap-3'>
              {data.category.map((c, index) => (
                <div key={c._id + index} className='text-sm flex items-center gap-1 bg-blue-50 mt-2'>
                  <p>{c.name}</p>
                  <IoClose size={20} className='hover:text-red-500 cursor-pointer' onClick={() => handleRemoveCategory(index)} />
                </div>
              ))}
            </div>
          </div>

          {/* SubCategory */}
          <div className='grid gap-1'>
            <label className='font-medium'>Sub Category</label>
            <select
              className='bg-blue-50 border w-full p-2 rounded'
              value={selectSubCategory}
              onChange={(e) => {
                const value = e.target.value;
                const subCategory = allSubCategory.find(el => el._id === value);
                if (!subCategory || data.subCategory.some(sub => sub._id === subCategory._id)) return;
                setData(prev => ({ ...prev, subCategory: [...prev.subCategory, subCategory] }));
                setSelectSubCategory("");
              }}
            >
              <option value={""}>Select Sub Category</option>
              {allSubCategory.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
            <div className='flex flex-wrap gap-3'>
              {data.subCategory.map((c, index) => (
                <div key={c._id + index} className='text-sm flex items-center gap-1 bg-blue-50 mt-2'>
                  <p>{c.name}</p>
                  <IoClose size={20} className='hover:text-red-500 cursor-pointer' onClick={() => handleRemoveSubCategory(index)} />
                </div>
              ))}
            </div>
          </div>

          {/* Unit */}
          <div className='grid gap-1'>
            <label htmlFor='unit' className='font-medium'>Unit</label>
            <input
              id='unit'
              type='text'
              placeholder='Enter product unit'
              name='unit'
              value={data.unit}
              onChange={handleChange}
              required
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Stock */}
          <div className='grid gap-1'>
            <label htmlFor='stock' className='font-medium'>Number of Stock</label>
            <input
              id='stock'
              type='number'
              min={0}
              name='stock'
              value={data.stock}
              onChange={handleChange}
              required
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Price */}
          <div className='grid gap-1'>
            <label htmlFor='price' className='font-medium'>Price</label>
            <input
              id='price'
              type='number'
              min={0}
              name='price'
              value={data.price}
              onChange={handleChange}
              required
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Discount */}
          <div className='grid gap-1'>
            <label htmlFor='discount' className='font-medium'>Discount</label>
            <input
              id='discount'
              type='number'
              min={0}
              name='discount'
              value={data.discount}
              onChange={handleChange}
              required
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Seller */}
          <div className='grid gap-1'>
            <label htmlFor='seller' className='font-medium'>Seller</label>
            <input
              id='seller'
              type='text'
              placeholder='Enter seller name'
              name='seller'
              value={data.seller || ''}
              onChange={handleChange}
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Seller Rating */}
          <div className='grid gap-1'>
            <label htmlFor='sellerRating' className='font-medium'>Seller Rating</label>
            <input
              id='sellerRating'
              type='number'
              step='0.1'
              min='0'
              max='5'
              placeholder='Enter seller rating (e.g. 4.5)'
              name='sellerRating'
              value={data.sellerRating}
              onChange={handleChange}
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Seller Rating Count */}
          <div className='grid gap-1'>
            <label htmlFor='sellerRatingCount' className='font-medium'>Seller Rating Count</label>
            <input
              id='sellerRatingCount'
              type='number'
              min='1'
              placeholder='Number of ratings'
              name='sellerRatingCount'
              value={data.sellerRatingCount}
              onChange={handleChange}
              className='bg-blue-50 p-2 outline-none border focus-within:border-primary-200 rounded'
            />
          </div>

          {/* Specifications Table - Creative UI */}
          <div className="grid gap-1">
            <label className="font-medium">Specifications</label>
            <div className="overflow-x-auto">
              <table className="min-w-full border text-left text-xs sm:text-sm bg-white rounded-lg shadow">
                <thead>
                  <tr className="bg-gradient-to-r from-blue-100 to-blue-200">
                    <th className="py-2 px-2 border-b font-semibold flex items-center gap-1">
                      Name
                      <span className="ml-1 text-gray-400" title="Specification Name">🛈</span>
                    </th>
                    <th className="py-2 px-2 border-b font-semibold flex items-center gap-1">
                      Value
                      <span className="ml-1 text-gray-400" title="Specification Value">🛈</span>
                    </th>
                    <th className="py-2 px-2 border-b font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Row for adding new spec */}
                  <tr>
                    <td className="py-1 px-2 border-b">
                      <input
                        ref={keyInputRef}
                        type="text"
                        value={specKey}
                        onChange={e => setSpecKey(e.target.value)}
                        className="bg-white p-1 border rounded w-full focus:ring-2 focus:ring-blue-200 transition"
                        placeholder="e.g. Color"
                        title="Specification Name"
                      />
                    </td>
                    <td className="py-1 px-2 border-b">
                      <input
                        ref={valueInputRef}
                        type="text"
                        value={specValue}
                        onChange={e => setSpecValue(e.target.value)}
                        className="bg-white p-1 border rounded w-full focus:ring-2 focus:ring-blue-200 transition"
                        placeholder="e.g. Red"
                        title="Specification Value"
                      />
                    </td>
                    <td className="py-1 px-2 border-b text-center">
                      <button
                        type="button"
                        className="text-green-600 hover:text-green-800 font-bold px-2 transition"
                        title="Add Specification"
                        onClick={handleAddSpecification}
                      >
                        <span role="img" aria-label="Add">➕</span>
                      </button>
                    </td>
                  </tr>
                  {/* Existing specs */}
                  {Object.entries(data.more_details || {}).map(([k, v], idx) => (
                    <tr key={k + idx} className={idx % 2 === 0 ? 'bg-blue-50' : 'bg-white'}>
                      <td className="py-1 px-2 border-b">
                        {k}
                      </td>
                      <td className="py-1 px-2 border-b">
                        {v}
                      </td>
                      <td className="py-1 px-2 border-b text-center">
                        <button
                          type="button"
                          className="text-red-600 hover:text-red-800 font-bold px-2 transition"
                          title="Delete Specification"
                          onClick={() => {
                            setData(prev => {
                              const newDetails = { ...prev.more_details };
                              delete newDetails[k];
                              return { ...prev, more_details: newDetails };
                            });
                          }}
                        >
                          <span role="img" aria-label="Delete">🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Product Options Section */}
          <div className="grid gap-1">
            <label className="font-medium">Product Options (e.g., Size, RAM, Color)</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Option Name (e.g., Size, RAM)"
                value={optionName}
                onChange={e => setOptionName(e.target.value)}
                className="bg-blue-50 p-1 border rounded w-40"
              />
              <button type="button" className="bg-green-600 text-white px-2 rounded" onClick={handleAddOption}>Add Option</button>
            </div>
            {options.map((opt, idx) => (
              <div key={idx} className="mb-2 border rounded p-2 bg-blue-50">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold">{opt.name}</span>
                  <button type="button" className="text-red-600 text-xs" onClick={() => handleRemoveOption(idx)}>Remove</button>
                </div>
                <div className="flex gap-2 mb-1">
                  <input
                    type="text"
                    placeholder={`Add value to ${opt.name}`}
                    value={selectedOptionIdx === idx ? optionValue : ''}
                    onChange={e => { setSelectedOptionIdx(idx); setOptionValue(e.target.value); }}
                    className="bg-white p-1 border rounded w-32"
                  />
                  <button type="button" className="bg-blue-600 text-white px-2 rounded" onClick={handleAddOptionValue}>Add Value</button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {opt.values.map((val, vIdx) => (
                    <span key={vIdx} className="bg-white border px-2 py-1 rounded flex items-center gap-1">
                      {val}
                      <button type="button" className="text-xs text-red-500" onClick={() => handleRemoveOptionValue(idx, vIdx)}>&times;</button>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div onClick={() => setOpenAddField(true)} className='hover:bg-primary-200 bg-white py-1 px-3 w-32 text-center font-semibold border border-primary-200 hover:text-neutral-900 cursor-pointer rounded'>
            Add Fields
          </div>

          <button className='bg-primary-100 hover:bg-primary-200 py-2 rounded font-semibold'>
            Submit
          </button>
        </form>
      </div>

      {ViewImageURL && <ViewImage url={ViewImageURL} close={() => setViewImageURL("")} />}
      {openAddField && (
        <AddFieldComponent
          value={fieldName}
          onChange={(e) => setFieldName(e.target.value)}
          submit={handleAddField}
          close={() => setOpenAddField(false)}
        />
      )}
    </section>
  );
};

export default UploadProduct;
